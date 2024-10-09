package com.example.researchpaperbackend;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeEmbeddingStore;
import dev.langchain4j.store.embedding.pinecone.PineconeServerlessIndexConfig;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static com.example.researchpaperbackend.ApiKeys.API_PINECONE;

@RestController
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

    @PostMapping("/upload-pdf")
    public ResponseEntity<String> uploadPDF(@RequestParam("file") MultipartFile file, String index) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Empty file");
        }

        try {
            String extractedText = extractTextFromPdf(file);

            String namespace = "namespac";

            EmbeddingStore<TextSegment> embeddingStore = createEmbeddingStore(index, namespace);

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

    private EmbeddingStore<TextSegment> createEmbeddingStore(String index, String namespace) throws Exception {
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
}

