package com.example.researchpaperbackend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.*;
import dev.langchain4j.store.embedding.pinecone.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static com.example.researchpaperbackend.ApiKeys.API_PINECONE;
import static com.example.researchpaperbackend.ApiKeys.API_OPENAI;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@RequestMapping("/api")
public class ResearchPaperController {

    private final EmbeddingModel embeddingModel;

    public ResearchPaperController() {
        this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }

    @CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
    @PostMapping("/upload-pdf")
    public ResponseEntity<String> uploadPDF(@RequestParam("file") MultipartFile file, String index, String namespace) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Empty file");
        }

        try {
            String extractedText = extractTextFromPdf(file);

            EmbeddingStore<TextSegment> embeddingStore = createEmbeddingStore(index, namespace);

            processAndStoreEmbeddings(extractedText, embeddingStore);

            return ResponseEntity.ok("Extracted Text:\n" + extractedText);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to process the PDF file");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred: " + e.getMessage());
        }
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try(PDDocument document = PDDocument.load(file.getInputStream()) ) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/search")
    public String search(@RequestParam String index, @RequestParam String text,@RequestParam String namespace) throws Exception{

        EmbeddingStore<TextSegment> embeddingStore = createEmbeddingStore(index,namespace);

        Embedding queryEmbedding = embeddingModel.embed(text).content();

        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(5)
                .build();

        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);

        if(searchResult.matches().isEmpty()){
            return "No matches found";
        }

        StringBuilder builder = new StringBuilder();
        for(EmbeddingMatch<TextSegment> match : searchResult.matches()){
            builder.append(match.embedded().text()).append("\n");
        }

        return getAISummary(builder.toString());
    }

    private String getAISummary(String collectedText) throws Exception {

        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper objectMapper = new ObjectMapper();

        String openaiApiKey = API_OPENAI;
        if(openaiApiKey == null || openaiApiKey.isEmpty()){
            throw new Exception("OpenAI API Key is empty");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", "gpt-3.5-turbo");

        ArrayNode messages = objectMapper.createArrayNode();

        ObjectNode systemMessage = objectMapper.createObjectNode();
        systemMessage.put("role", "system");
        systemMessage.put("content", "Use the user's prompt to generate a summary");

        ObjectNode userMessage = objectMapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", "prompt\n\nText to summarize:\n" + collectedText);

        messages.add(systemMessage);
        messages.add(userMessage);

        payload.set("messages", messages);

        String requestBody = objectMapper.writeValueAsString(payload);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openaiApiKey.trim());
        headers.set("Content-Type", "application/json");

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.openai.com/v1/chat/completions",
                    HttpMethod.POST,
                    request,
                    String.class
            );

            String responseBody = response.getBody();
            return extractStringSummary(responseBody);
        } catch (Exception e){

            throw new Exception("ERROR: " + e);
        }
    }

    private String extractStringSummary(String responseBody) throws Exception {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ObjectNode json = (ObjectNode) objectMapper.readTree(responseBody);
            ArrayNode choices = (ArrayNode) json.get("choices");
            if (!choices.isEmpty()){
                ObjectNode firstChoice = (ObjectNode) choices.get(0);
                ObjectNode message = (ObjectNode) firstChoice.get("message");
                return message.get("content").asText();
            }

        } catch (Exception e){
            throw new Exception("ERROR: "+ e);
        }
        return "ERROR: ";
    }

    private EmbeddingStore<TextSegment> createEmbeddingStore(String index, String namespace) {
        return PineconeEmbeddingStore.builder()
                .apiKey(API_PINECONE)
                .index(index)
                .nameSpace(namespace)
                .createIndex(PineconeServerlessIndexConfig.builder()
                        .cloud("AWS")
                        .region("us-east-1")
                        .dimension(embeddingModel.dimension())
                        .build())
                .build();
    }

    private void processAndStoreEmbeddings(String text, EmbeddingStore<TextSegment> embeddingStore) {
        final int maxTokenPerChunk = 500;
        String[] segments = text.split(" ");

        StringBuilder currentChunk = new StringBuilder();
        int tokenCount = 0;

        for(String segment : segments) {
            if(!segment.trim().isEmpty()) {
                if (tokenCount + 1 > maxTokenPerChunk){

                    TextSegment textSegment = TextSegment.from(currentChunk.toString());
                    Embedding embedding = embeddingModel.embed(textSegment).content();
                    embeddingStore.add(embedding, textSegment);

                    currentChunk.setLength(0);
                    tokenCount = 0;
                }

                currentChunk.append(segment).append(" ");
                tokenCount++;
            }
        }


        if(currentChunk.length() > 0){
            TextSegment textSegment = TextSegment.from(currentChunk.toString());
            Embedding embedding = embeddingModel.embed(textSegment).content();
            embeddingStore.add(embedding, textSegment);
        }
    }
}

