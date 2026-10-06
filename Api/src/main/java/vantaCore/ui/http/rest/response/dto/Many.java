package vantaCore.ui.http.rest.response.dto;

import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;

import java.util.List;

final public class Many<T> {
    final public Metadata meta;

    final public List<Item<T>> data;

    public Many(Metadata meta, Collection<T> data)
    {
        this.meta = meta;
        this.data = data.data();
    }
}
