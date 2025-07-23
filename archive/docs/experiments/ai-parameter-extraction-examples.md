# AI Intelligent Parameter Extraction Examples

This document demonstrates how the AI intelligently matches different document taxonomies to standardized required parameters.

## How It Works

1. **Process Definition**: Each process defines required parameters with standardized names
2. **AI Mapping**: The AI receives these parameters and intelligently maps document fields
3. **Flexible Extraction**: Works with any document format or language

## Example 1: South African ID Card

**Document Fields:**
```
Surname: Van Der Berg
Names: Johannes Petrus
Identity Number: 9501015800088
Date of Birth: 95/01/01
Sex: M
Country of Birth: RSA
Status: Citizen
```

**AI Extracts and Maps to:**
```json
{
  "fields": {
    "firstName": "Johannes Petrus",
    "lastName": "Van Der Berg",
    "idNumber": "9501015800088",
    "dateOfBirth": "1995-01-01",
    "gender": "Male",
    "nationality": "South African",
    "documentType": "National ID Card"
  }
}
```

## Example 2: US Passport

**Document Fields:**
```
Given Names: JOHN MICHAEL
Surname: SMITH
Passport No: 123456789
Date of birth: 15 JAN 1990
Place of birth: CALIFORNIA, U.S.A.
Date of issue: 20 MAY 2020
Date of expiration: 19 MAY 2030
Sex: M
```

**AI Extracts and Maps to:**
```json
{
  "fields": {
    "firstName": "John Michael",
    "lastName": "Smith",
    "idNumber": "123456789",
    "dateOfBirth": "1990-01-15",
    "gender": "Male",
    "nationality": "USA",
    "documentType": "Passport",
    "documentIssueDate": "2020-05-20",
    "documentExpiry": "2030-05-19"
  }
}
```

## Example 3: Indian Aadhaar Card

**Document Fields:**
```
नाम / Name: राहुल शर्मा / Rahul Sharma
जन्म तिथि / DOB: 25/03/1985
पुरुष / Male
आधार संख्या / Aadhaar No: 1234 5678 9012
```

**AI Extracts and Maps to:**
```json
{
  "fields": {
    "firstName": "Rahul",
    "lastName": "Sharma",
    "idNumber": "123456789012",
    "dateOfBirth": "1985-03-25",
    "gender": "Male",
    "nationality": "Indian",
    "documentType": "Aadhaar Card"
  }
}
```

## Example 4: UK Driver's License

**Document Fields:**
```
1. MORGAN
2. SARAH ELIZABETH
3. 24.12.1992
4a. 01.09.2018
4b. 31.08.2028
4c. DVLA
5. MORGA924122SE9AB 12
```

**AI Extracts and Maps to:**
```json
{
  "fields": {
    "firstName": "Sarah Elizabeth",
    "lastName": "Morgan",
    "idNumber": "MORGA924122SE9AB",
    "dateOfBirth": "1992-12-24",
    "documentType": "Driver's License",
    "documentIssueDate": "2018-09-01",
    "documentExpiry": "2028-08-31",
    "nationality": "British"
  }
}
```

## Example 5: Company Registration (Project Registration Process)

**Document Fields:**
```
Company Name: Tech Innovations (PTY) LTD
Registration Number: 2020/123456/07
Registered Address: 123 Main Street, Cape Town
Director: Mr. John Smith
Date of Registration: 15-Mar-2020
```

**For Project Registration, AI Maps to:**
```json
{
  "fields": {
    "companyRegistration": "2020/123456/07",
    "projectManager": "John Smith"
  }
}
```

## Key Features

### 1. **Multi-language Support**
The AI can handle documents in multiple languages and scripts, extracting and translating to English parameter names.

### 2. **Format Normalization**
- Dates: Converts any date format to YYYY-MM-DD
- Names: Properly cases and formats names
- Numbers: Removes spaces and special characters from ID numbers

### 3. **Intelligent Field Mapping**
- "Surname" → lastName
- "Family Name" → lastName
- "Given Names" → firstName
- "Forenames" → firstName
- "DOB" → dateOfBirth
- "Sex" → gender
- "Document No." → idNumber

### 4. **Missing Field Handling**
When a required field is not found, the AI explicitly states:
```json
{
  "fields": {
    "firstName": "John",
    "lastName": "Smith",
    "idNumber": "Not found in document",
    "dateOfBirth": "1990-01-15"
  },
  "validation": {
    "allRequiredFieldsFound": false,
    "missingFields": ["idNumber"]
  }
}
```

## Implementation Details

### Process Configuration
```javascript
// In Process model
requiredParameters: [
  {
    name: 'firstName',
    displayName: 'First Name',
    type: 'string',
    description: 'The person\'s first name or given name',
    validation: { required: true }
  },
  // ... more parameters
]
```

### AI System Prompt
The AI receives:
1. Process-specific required parameters
2. Instructions to intelligently map fields
3. Examples of different document formats
4. Validation rules

### User Message Enhancement
When a document is uploaded, the system automatically adds:
- List of required fields to extract
- Mapping instructions
- Format requirements

## Benefits

1. **Universal Document Support**: Works with any ID document worldwide
2. **No Hardcoding**: No need to program specific document layouts
3. **Future-proof**: New document types work automatically
4. **Consistent Output**: Always returns standardized field names
5. **Validation**: Ensures all required fields are captured

This approach ensures that the Spark AI Domain System can handle identity verification for users from any country without requiring document-specific programming.