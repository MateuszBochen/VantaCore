package vantaCore.ui.http.rest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
final public class HelloController {

    @GetMapping("/test")
    public ResponseEntity<Object> getProduct() {
        return new ResponseEntity<>("Product is created successfully 2", HttpStatus.CREATED);
    }

}
