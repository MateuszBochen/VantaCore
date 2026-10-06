package vantaCore.application.project.domain.vo;

import java.util.regex.Pattern;

public record ProjectPrefix(String value) {

    private static final Pattern FORMAT = Pattern.compile("^[A-Z][A-Z0-9]{1,9}$");

    public ProjectPrefix {
        if (value == null) {
            throw new IllegalArgumentException("Project prefix cannot be null");
        }

        value = value.trim();

        if (!FORMAT.matcher(value).matches()) {
            throw new IllegalArgumentException("Project prefix must be 2-10 uppercase letters/digits, starting with a letter");
        }
    }
}
