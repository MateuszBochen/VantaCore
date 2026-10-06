package vantaCore.ui.http.rest.response;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Metadata;
import vantaCore.ui.http.rest.response.dto.Single;

public class OpenApiResponse<T> extends ResponseEntity<T>
{
    /**
     * @inheritDoc
     * @author Mateusz Bochen
     */
    public OpenApiResponse(HttpStatus status) {
        super(status);
    }

    /**
     * @inheritDoc
     * @author Mateusz Bochen
     */
    public OpenApiResponse(@Nullable T body, HttpStatus status) {
        super(body, status);
    }

    public static OpenApiResponse<Empty> empty(HttpStatus status)
    {
        return new OpenApiResponse<>(status);
    }

    public static <T> OpenApiResponse<Single<T>> one(Item<T> item, HttpStatus status)
    {
        String type = item.resource().getClass().getSimpleName();
        return new OpenApiResponse<>(new Single<>(item.id(), type, item.resource()), status);
    }

    public static <T> OpenApiResponse<Many<T>> many(Collection<T> itemsObject, HttpStatus status)
    {
        Metadata meta = new Metadata(itemsObject.page(), itemsObject.limit(), itemsObject.total());
        return new OpenApiResponse<>(new Many<>(meta, itemsObject), status);
    }
}