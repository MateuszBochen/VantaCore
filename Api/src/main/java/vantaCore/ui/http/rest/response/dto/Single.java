package vantaCore.ui.http.rest.response.dto;

public record Single<T>(String id, String type, T resource) {
}
