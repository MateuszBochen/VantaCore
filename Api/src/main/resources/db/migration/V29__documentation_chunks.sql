-- Generative documentation search (RAG) - see DocumentationChunk/ReindexDocumentationWhenPlatformDocumentationWasUpdated.
-- Requires the pgvector extension (see pgvector/pgvector Docker image - a plain postgres:16 image
-- does not have this available).
CREATE EXTENSION IF NOT EXISTS vector;

-- embedding is 1024-dim to match the bge-m3 embedding model (see OllamaClient) - changing embedding
-- models later means changing this dimension too, and a full reindex (old vectors aren't comparable
-- across models).
CREATE TABLE documentation_chunks (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    source_type varchar(32) NOT NULL,
    source_id uuid,
    label text,
    content text NOT NULL,
    embedding vector(1024) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY documentation_chunks ADD CONSTRAINT documentation_chunks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY documentation_chunks ADD CONSTRAINT fk_documentation_chunks_project FOREIGN KEY (project_id) REFERENCES projects(id);

-- Plain btree for replaceAllForProject's DELETE WHERE project_id = ? and the PROJECT-scoped half of
-- findNearest's WHERE.
CREATE INDEX idx_documentation_chunks_project_id ON documentation_chunks (project_id);

-- HNSW, cosine distance (<=> operator) - matches findNearest's ORDER BY. Requires pgvector >= 0.5.
CREATE INDEX idx_documentation_chunks_embedding ON documentation_chunks USING hnsw (embedding vector_cosine_ops);
