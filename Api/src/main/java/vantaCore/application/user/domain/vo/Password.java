package vantaCore.application.user.domain.vo;


import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Password {

    private final String password;
    private final BCryptPasswordEncoder encoder;

    private Password(String password) {
        this.encoder = new BCryptPasswordEncoder();
        this.password = password;
    }

    public static Password fromRaw(String rawPassword) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        return new Password(encoder.encode(rawPassword));
    }

    public static Password fromHash(String hashedPassword) {
        return new Password(hashedPassword);
    }

    public String getPassword() {
        return password;
    }

    public boolean isSame(String rawPassword) {
        return  this.encoder.matches(rawPassword, this.password);
    }
}
