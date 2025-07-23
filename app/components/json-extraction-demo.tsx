'use client';

import React, { useState } from 'react';
import { SmartMessageDisplay } from './smart-message-display';

const demoResponses = [
  {
    title: "Standard Fields Format",
    content: `I've extracted the following information from your document:

\`\`\`json
{
  "fields": {
    "firstName": "John",
    "lastName": "Smith",
    "idNumber": "123456789",
    "dateOfBirth": "1990-01-15",
    "nationality": "South African"
  },
  "validation": {
    "allRequiredFieldsFound": true
  }
}
\`\`\`

The document appears to be valid.`
  },
  {
    title: "Flat JSON Structure",
    content: `Here's what I found in your ID document:

\`\`\`json
{
  "firstName": "Maria",
  "lastName": "Garcia",
  "idNumber": "987654321",
  "dateOfBirth": "1985-03-22",
  "gender": "Female",
  "documentType": "National ID",
  "confidence": 0.95
}
\`\`\`

All information extracted successfully.`
  },
  {
    title: "Nested Structure",
    content: `I've processed your document:

\`\`\`json
{
  "personalInfo": {
    "firstName": "Ahmed",
    "lastName": "Hassan"
  },
  "document": {
    "idNumber": "555666777",
    "type": "Passport",
    "expiry": "2025-12-31"
  },
  "verification": {
    "status": "verified",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

Document verification complete.`
  },
  {
    title: "Complex AI Response",
    content: `Analysis of your uploaded document:

\`\`\`json
{
  "extractedData": {
    "fullName": "Sarah Johnson",
    "documentNumber": "DL123456789",
    "birthDate": "1992-07-08"
  },
  "documentAnalysis": {
    "type": "Driver's License",
    "issueDate": "2020-01-15",
    "expiryDate": "2025-01-15"
  },
  "processingMetadata": {
    "confidence": 0.98,
    "processingTime": "2.3s"
  }
}
\`\`\`

The document is valid and all key information has been extracted.`
  }
];

export function JsonExtractionDemo() {
  const [selectedDemo, setSelectedDemo] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">JSON Field Extraction Demo</h2>
        <p className="text-gray-600">See how different JSON structures automatically convert to animated field displays</p>
      </div>

      {/* Demo selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {demoResponses.map((demo, index) => (
          <button
            key={index}
            onClick={() => setSelectedDemo(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDemo === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {demo.title}
          </button>
        ))}
      </div>

      {/* Demo display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {demoResponses[selectedDemo].title}
          </h3>
          <p className="text-sm text-gray-600">
            Watch how the JSON gets automatically converted to animated field displays
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <SmartMessageDisplay
            content={demoResponses[selectedDemo].content}
            requiredParameters={[
              { name: 'firstName', displayName: 'First Name', type: 'string' },
              { name: 'lastName', displayName: 'Last Name', type: 'string' },
              { name: 'idNumber', displayName: 'ID Number', type: 'string' },
              { name: 'dateOfBirth', displayName: 'Date of Birth', type: 'date' },
              { name: 'nationality', displayName: 'Nationality', type: 'string' },
              { name: 'gender', displayName: 'Gender', type: 'string' },
              { name: 'documentType', displayName: 'Document Type', type: 'string' },
            ]}
          />
        </div>
      </div>

      {/* Technical details */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How It Works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Detects any JSON code block in AI responses</li>
          <li>• Extracts fields from any structure (nested, flat, or mixed)</li>
          <li>• Filters out metadata (validation, confidence, timestamps)</li>
          <li>• Displays fields with animated slide-in effects</li>
          <li>• Shows validation indicators based on process requirements</li>
        </ul>
      </div>
    </div>
  );
}