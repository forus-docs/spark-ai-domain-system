# Strict Parameter Extraction - ONLY Required Fields

The AI is now configured to extract ONLY the required parameters defined in the process, ignoring all other information in the document.

## Example: South African ID Card

### What the document contains:
```
Republic of South Africa
Identity Document

Surname: Van Der Berg
Names: Johannes Petrus
Identity Number: 9501015800088
Date of Birth: 95/01/01
Sex: M
Country of Birth: RSA
Status: Citizen
Nationality: RSA

[Photo]
[Barcode]
[Address: 123 Main Street, Cape Town]
[Issue Date: 2018/05/15]
```

### What the AI extracts (ONLY required fields):
```json
{
  "fields": {
    "firstName": "Johannes Petrus",
    "lastName": "Van Der Berg",
    "idNumber": "9501015800088",
    "dateOfBirth": "1995-01-01",
    "nationality": "South African",
    "gender": "Male",
    "documentType": "National ID Card",
    "documentExpiry": null,
    "documentIssueDate": "2018-05-15"
  },
  "validation": {
    "allRequiredFieldsFound": false,
    "missingFields": ["documentExpiry"]
  }
}
```

### What the AI IGNORES:
- ❌ Address information
- ❌ Photo
- ❌ Barcode
- ❌ Country of Birth
- ❌ Status (Citizen/Resident)
- ❌ Any other fields not in the required parameters list

## Example: US Passport

### What the document contains:
```
UNITED STATES OF AMERICA
PASSPORT

Type: P
Code: USA
Passport No: 123456789
Surname: SMITH
Given Names: JOHN MICHAEL
Nationality: UNITED STATES OF AMERICA
Date of birth: 15 JAN 1990
Sex: M
Place of birth: CALIFORNIA, U.S.A.
Date of issue: 20 MAY 2020
Date of expiration: 19 MAY 2030
Authority: UNITED STATES DEPARTMENT OF STATE
Endorsements: SEE PAGE 27

[Photo]
[Signature]
[Machine Readable Zone]
```

### What the AI extracts (ONLY required fields):
```json
{
  "fields": {
    "firstName": "John Michael",
    "lastName": "Smith",
    "idNumber": "123456789",
    "dateOfBirth": "1990-01-15",
    "nationality": "USA",
    "gender": "Male",
    "documentType": "Passport",
    "documentExpiry": "2030-05-19",
    "documentIssueDate": "2020-05-20"
  },
  "validation": {
    "allRequiredFieldsFound": true,
    "missingFields": []
  }
}
```

### What the AI IGNORES:
- ❌ Place of birth
- ❌ Authority
- ❌ Endorsements
- ❌ Type/Code fields
- ❌ Signature
- ❌ Machine Readable Zone
- ❌ Any other passport-specific fields

## Key Rules Enforced:

1. **Exact Field Count**: The JSON response contains EXACTLY the required parameters - no more, no less
2. **Null for Missing**: If a required field isn't found, it's set to `null` (not omitted)
3. **No Extra Fields**: Even if the document has 50 fields, only the required 9 are returned
4. **Consistent Structure**: Every response has the same JSON structure with the same field names
5. **Smart Mapping**: Document labels are mapped to standardized parameter names

## Benefits:

- **Predictable Output**: Frontend always receives the exact fields expected
- **Clean Data**: No need to filter out unwanted fields
- **Privacy**: Sensitive extra information is not extracted
- **Efficiency**: Smaller response size, focused on what's needed
- **Compliance**: Only processes data required for the specific process