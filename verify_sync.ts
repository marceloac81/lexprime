
import {
    generateContactsCSV, parseContactsCSV,
    generateCasesCSV, parseCasesCSV,
    generateDeadlinesCSV, parseDeadlinesCSV,
    generateAppointmentsCSV, parseAppointmentsCSV
} from './utils/importHelpers';

const test = () => {
    console.log("Starting Verification...");

    // Test Cases with JSON
    const mockCases = [{
        id: '123e4567-e89b-12d3-a456-426614174000',
        number: '12345',
        title: 'Test Case',
        clientId: 'client-123',
        clientName: 'John Doe',
        clientPosition: 'Ativo',
        opposingParty: 'Jane Doe',
        court: 'Vara 1',
        uf: 'RJ',
        city: 'Rio',
        area: 'Civil',
        value: 1000,
        status: 'Ativo',
        tags: ['tag1', 'tag2'],
        description: 'Test Description',
        occurrences: [{ id: 'occ1', date: '2023-01-01', description: 'occ test' }],
        history: [{ id: 'hist1', date: '2023-01-01', description: 'hist test', user: 'admin' }],
        createdAt: '2023-01-01T00:00:00Z'
    }];

    const casesCSV = generateCasesCSV(mockCases);
    console.log("Generated Cases CSV:\n", casesCSV);
    const parsedCases = parseCasesCSV(casesCSV);

    if (parsedCases[0].id === mockCases[0].id &&
        parsedCases[0].tags.length === 2 &&
        parsedCases[0].occurrences.length === 1 &&
        parsedCases[0].history.length === 1) {
        console.log("✅ Case CSV Sync Verified");
    } else {
        console.error("❌ Case CSV Sync Failed", parsedCases[0]);
    }

    // Test Deadlines with assignedIds
    const mockDeadlines = [{
        id: 'd1',
        title: 'Test Deadline',
        dueDate: '2023-12-31',
        caseId: 'case1',
        assignedIds: ['user1', 'user2']
    }];
    const deadlinesCSV = generateDeadlinesCSV(mockDeadlines, []);
    const parsedDeadlines = parseDeadlinesCSV(deadlinesCSV);
    if (parsedDeadlines[0].id === 'd1' && parsedDeadlines[0].assignedIds.length === 2) {
        console.log("✅ Deadline CSV Sync Verified");
    } else {
        console.error("❌ Deadline CSV Sync Failed", parsedDeadlines[0]);
    }

    console.log("Verification Complete!");
};

test();
