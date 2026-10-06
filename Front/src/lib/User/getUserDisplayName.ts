import type {UserSummary} from './Type/types';

// The API returns name/lastName as separate fields - this is the one place
// that joins them, so every picker/label shows the same "First Last" format.
const getUserDisplayName = (user: UserSummary): string => `${user.name} ${user.lastName}`.trim();

export default getUserDisplayName;