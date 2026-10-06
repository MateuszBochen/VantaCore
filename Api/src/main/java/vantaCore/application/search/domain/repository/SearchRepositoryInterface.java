package vantaCore.application.search.domain.repository;

import vantaCore.application.search.domain.SearchCriteria;

import java.util.List;
import java.util.UUID;

/** Query-only port over existing tables' generated search_vector columns (see
 V25__add_search_vectors.sql) - there's no Search aggregate, this is a pure read model. */
public interface SearchRepositoryInterface {

    SearchPage<ProjectHit> searchProjects(SearchCriteria criteria, int limit, int offset);

    SearchPage<SubProjectHit> searchSubProjects(SearchCriteria criteria, int limit, int offset);

    SearchPage<TicketHit> searchTickets(SearchCriteria criteria, int limit, int offset);

    SearchPage<TestCaseHit> searchTestCases(SearchCriteria criteria, int limit, int offset);

    /** One page of hits plus the total number of matches across ALL pages (same criteria). */
    record SearchPage<T>(List<T> hits, long total) {
    }

    record ProjectHit(UUID id, String name) {
    }

    record SubProjectHit(UUID id, UUID projectId, String name) {
    }

    record TicketHit(UUID id, UUID projectId, String key, String title) {
    }

    record TestCaseHit(UUID id, UUID ticketId, UUID projectId, String ticketKey, String title) {
    }
}
