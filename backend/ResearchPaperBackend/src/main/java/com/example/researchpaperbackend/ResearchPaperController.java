package com.example.researchpaperbackend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ResearchPaperController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }
}
