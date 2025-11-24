# @ahamove/pelias-client

> A TypeScript client library for Pelias geocoding, optimized for Vietnamese addresses with Elasticsearch 7.x integration.

[![npm version](https://img.shields.io/npm/v/@ahamove/pelias-client.svg)](https://www.npmjs.com/package/@ahamove/pelias-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔍 **Advanced Search** - Multi-index search with personalization (favorites, recent locations)
- 🇻🇳 **Vietnamese Optimization** - Specialized address parsing and text normalization
- 📍 **Geographic Scoring** - Distance-based relevance with proximity calculations
- ⚡ **Performance-First** - Optimized Elasticsearch queries with conditional execution
- 🎯 **Type-Safe** - Full TypeScript support with generic types
- 🔧 **Flexible** - Configurable format/extract functions for custom processing

## Installation

```bash
# Using pnpm (recommended)
pnpm add @ahamove/pelias-client

# Using npm
npm install @ahamove/pelias-client

# Using yarn
yarn add @ahamove/pelias-client
```

## Quick Start

```typescript
import { PeliasClient } from '@ahamove/pelias-client';
import { Client } from '@elastic/elasticsearch';

// Initialize Elasticsearch client
const elasticClient = new Client({
  node: 'http://localhost:9200',
});

// Create Pelias client
const peliasClient = new PeliasClient({
  elasticClient,
  indices: {
    pelias: 'pelias',
    favorite: 'favorite_location',
    recent: 'recent_location',
  },
});

// Search for an address
const results = await peliasClient.search({
  text: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
  size: 10,
  lat: 10.762622,
  lon: 106.660172,
});
```

## Core Methods

### Search

Search for addresses with optional geographic filtering and personalization:

```typescript
const results = await peliasClient.search({
  text: 'Landmark 81',
  size: 5,
  lat: 10.7946,
  lon: 106.7218,
  userId: 'user123', // Enable personalized results
  geocode: true, // Include administrative area matching
});
```

### Geocode

Find coordinates for an address:

```typescript
const location = await peliasClient.geocode({
  address: 'Vincom Center, Đồng Khởi, Quận 1, TP.HCM',
});
```

### Nearby

Find nearby locations:

```typescript
const nearby = await peliasClient.nearBy({
  lat: 10.762622,
  lon: 106.660172,
  radius: 1000, // meters
  size: 10,
});
```

### CRUD Operations

```typescript
// Create a new location
await peliasClient.create({
  id: 'loc_123',
  name: 'My Favorite Place',
  latitude: 10.762622,
  longitude: 106.660172,
});

// Update a location
await peliasClient.update({
  id: 'loc_123',
  name: 'Updated Name',
});

// Find by ID
const location = await peliasClient.findById('loc_123');

// Delete a location
await peliasClient.delete('loc_123');
```

## Vietnamese Address Processing

The library includes specialized processing for Vietnamese addresses:

- **Accent Normalization** - Handles Vietnamese diacritical marks
- **Dictionary-based Parsing** - Recognizes administrative divisions (Phường, Quận, Tỉnh, etc.)
- **Abbreviation Expansion** - Expands common Vietnamese address abbreviations
- **Text Similarity** - Advanced string matching algorithms optimized for Vietnamese text

```typescript
import { extract, format } from '@ahamove/pelias-client/format/vietnam';

// Extract address components
const parts = extract('123 Nguyễn Văn Linh, P. Tân Thuận Đông, Q.7, TP.HCM');
// { venue: '123', address: 'Nguyễn Văn Linh', ... }

// Format address text
const formatted = format(parts);
```

## Configuration

### Generic Type Support

The client supports custom types for models and responses:

```typescript
interface CustomLocation {
  id: string;
  title: string;
  coordinates: [number, number];
}

const client = new PeliasClient<CustomLocation, CustomResponse, CustomCount>({
  elasticClient,
  indices: { pelias: 'pelias' },
  format: customFormatFunction,
  extract: customExtractFunction,
});
```

### Custom Processing Functions

Provide your own format/extract functions:

```typescript
const client = new PeliasClient({
  elasticClient,
  indices: { pelias: 'pelias' },
  format: (parts) => {
    // Custom formatting logic
    return formatted;
  },
  extract: (text) => {
    // Custom extraction logic
    return parts;
  },
});
```

## Development

### Prerequisites

- Node.js 16+
- pnpm 10.14.0+
- Elasticsearch 7.x

### Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Project Structure

```
src/
├── index.ts                 # Main PeliasClient class
├── transforms/
│   ├── elastic.transform.ts # Elasticsearch query builder
│   ├── pelias.transform.ts  # Response transformer
│   └── document.transform.ts # Document manipulation
├── format/vietnam/          # Vietnamese address processing
│   ├── extract.ts           # Address parsing
│   ├── format.ts            # Address formatting
│   └── deaccents.ts         # Text normalization
├── models/                  # TypeScript interfaces
├── resources/               # Request parameter types
└── utils/                   # Utility functions
```

## Testing

The library includes comprehensive tests with sample Vietnamese addresses:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/index.test.ts

# Run with coverage
pnpm test -- --coverage
```

Add test cases in `src/index.test.ts` to verify address parsing and search behavior.

## License

MIT © [AhaMove](https://github.com/AhaMove)
