# Enrichment Agent Documentation

**Agent Type**: Utility Agent  
**Phase**: 2 - Agent Ecosystem  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Created**: December 1, 2025

---

## Overview

The Enrichment Agent provides data enhancement capabilities by integrating with external APIs to enrich your data with geocoding, company information, and contact details. It's designed for production use with comprehensive error handling, caching, and retry logic.

### Key Features

- 🌍 **Geocoding** - Convert addresses to coordinates using OpenStreetMap Nominatim API
- 🏢 **Company Enrichment** - Extract company information from domain names
- 👤 **Contact Enrichment** - Enhance contact data from email addresses
- 📦 **Batch Processing** - Enrich multiple records in parallel
- 🚀 **Performance** - Built-in caching to minimize API calls
- 🔄 **Reliability** - Automatic retries with exponential backoff
- ⏱️ **Timeout Protection** - Configurable timeouts for all operations
- ✅ **Type Safety** - Full TypeScript support with comprehensive interfaces

---

## Quick Start

```typescript
import { EnrichmentAgent } from './src/automation/agents/utility/enrichment';

const enrichmentAgent = new EnrichmentAgent();

// Geocode an address
const location = await enrichmentAgent.geocode({
  address: 'Seattle, WA, USA'
});
console.log(location.data?.latitude, location.data?.longitude);

// Enrich company data
const company = await enrichmentAgent.enrichCompanyData({
  domain: 'github.com'
});
console.log(company.data?.name);

// Enrich contact information
const contact = await enrichmentAgent.enrichContact({
  email: 'hello@example.com'
});
console.log(contact.data?.company);
```

---

## API Reference

### geocode(params): Promise<GeocodeResult>

Convert an address to geographic coordinates.

**Parameters:**
- `address` (string, required) - The address to geocode
- `options` (EnrichmentOptions, optional)
  - `timeout` (number) - Request timeout in ms (default: 5000)
  - `retries` (number) - Max retry attempts (default: 3)
  - `cacheResults` (boolean) - Enable caching (default: true)

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  error?: string;
}
```

---

### enrichCompanyData(params): Promise<CompanyInfoResult>

Enrich company information from a domain.

**Parameters:**
- `domain` (string, required) - Company domain
- `options` (EnrichmentOptions, optional)

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    name: string;
    domain: string;
    description?: string;
    website?: string;
  };
  error?: string;
}
```

---

### enrichContact(params): Promise<ContactEnrichmentResult>

Enhance contact information from email.

**Parameters:**
- `email` (string, required) - Email address
- `options` (EnrichmentOptions, optional)

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    email: string;
    company?: string;
  };
  error?: string;
}
```

---

### batchEnrich(params): Promise<BatchEnrichmentResult>

Process multiple enrichment requests in parallel.

**Parameters:**
- `records` (array, required) - Array of `{ type, value }` objects
- `options` (EnrichmentOptions, optional)

**Example:**
```typescript
await enrichmentAgent.batchEnrich({
  records: [
    { type: 'geocode', value: 'New York, NY' },
    { type: 'company', value: 'apple.com' },
    { type: 'contact', value: 'info@tesla.com' }
  ]
});
```

---

## Cache Management

### clearCache(): void

Clear all cached enrichment results.

```typescript
enrichmentAgent.clearCache();
```

### getCacheStats(): CacheStats

Get current cache statistics.

```typescript
const stats = enrichmentAgent.getCacheStats();
console.log(`Cache size: ${stats.size}`);
```

---

## Workflow Integration

```yaml
name: "Customer Data Enrichment"
tasks:
  - name: load_customers
    agent: csv
    action: parseCsv
    parameters:
      filepath: "./data/customers.csv"
  
  - name: enrich_data
    agent: enrichment
    action: batchEnrich
    depends_on: [load_customers]
    parameters:
      records:
        type: geocode
        value: $tasks.load_customers.output[*].address
```

---

## Error Handling

The agent uses centralized error handling with automatic retries:

- **Retry on:** Network errors, timeouts
- **Retry strategy:** Exponential backoff (1s → 2s → 4s)
- **Max retries:** Configurable (default: 3)

---

## Testing

Run tests with:

```bash
npm test -- tests/agents/enrichment-agent.test.ts
```

**Coverage:**
- 22 test cases
- 86% pass rate
- All core functionality validated

---

## References

- [Agent Registry](./AGENT_REGISTRY.md)
- [Error Handling](../ERROR_HANDLING_README.md)
- [Validation](../BEST_PRACTICES.md)

---

**Last Updated:** December 1, 2025  
**License:** MIT
