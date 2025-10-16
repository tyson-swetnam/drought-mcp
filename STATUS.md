# Drought MCP Project Status

**Last Updated:** 2025-10-15

## Current Phase: Planning & Documentation

This project is in the **planning and initial documentation phase**. Core planning documents have been created to guide implementation.

## Completed ✓

### Core Files
- [x] **README.md** - Comprehensive overview, features, usage guide
- [x] **package.json** - Node.js project configuration with dependencies
- [x] **.env.example** - Environment configuration template
- [x] **LICENSE** - Apache 2.0 license
- [x] **.gitignore** - Git ignore patterns

### Documentation Status

The following core documentation has been created:
- [x] Project overview and feature description
- [x] Installation and configuration instructions
- [x] MCP tool specifications (4 tools defined)
- [x] Data schema overview
- [x] Drought severity integration with wildfire risk

## In Progress 🚧

The following detailed documentation needs to be created:

### High Priority
- [ ] **docs/implementation_plan.md** - Detailed 7-phase implementation roadmap
- [ ] **docs/api_endpoints.md** - US Drought Monitor API documentation
- [ ] **docs/data_schema.md** - Schema mapping and transformation details
- [ ] **docs/architecture.md** - System architecture and design patterns

### Medium Priority
- [ ] **docs/fire_behavior_integration.md** - Integration guide with fire-behavior app
- [ ] **CONTRIBUTING.md** - Developer contribution guidelines

### Lower Priority
- [ ] **CLAUDE.md** - AI assistant guidance
- [ ] Example queries and use cases
- [ ] Troubleshooting guide expansions

## Not Started ⏳

### Implementation (Phase 2)
- [ ] `src/` directory structure
- [ ] MCP server implementation (`src/index.js`)
- [ ] Tool handlers (`src/tools/`)
- [ ] API clients (`src/api/`)
- [ ] Schema transformers (`src/schemas/`)
- [ ] Utility functions (`src/utils/`)

### Testing (Phase 3)
- [ ] `tests/` directory structure
- [ ] Unit tests
- [ ] Integration tests
- [ ] Test fixtures and mocks

## MCP Tools Defined

The following 4 MCP tools are fully specified in the README:

1. **get_drought_current** - Get current drought conditions for a location
2. **get_drought_by_area** - Get drought statistics for a state/region
3. **get_drought_historical** - Retrieve historical drought trends
4. **get_drought_statistics** - Get statistical summaries and comparisons

## Key Design Decisions

### Data Sources
- **Primary**: US Drought Monitor Data Services (https://droughtmonitor.unl.edu/)
- **API**: NDMC Data API (https://usdmdataservices.unl.edu/api/)
- **Format**: GeoJSON, JSON, CSV support
- **Update Frequency**: Weekly (Thursdays)

### Technology Stack
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTTP Client**: axios
- **GeoJSON Processing**: @turf/turf
- **Schema Validation**: zod
- **Testing**: jest

### Caching Strategy
- **Default TTL**: 24 hours (drought data updates weekly)
- **Type**: In-memory for development, Redis for production
- **Key Format**: `drought:{type}:{location}:{date}`

### Integration Points
- Compatible with fire-behavior `wildfire_prompt_template.json` schema
- Drought severity contributes to overall wildfire risk score
- D0-D4 drought categories map to risk points (0-50)

## Next Steps

### Immediate (Week 1)
1. Complete remaining documentation files:
   - implementation_plan.md
   - api_endpoints.md
   - data_schema.md
   - architecture.md

2. Review and refine MCP tool specifications

3. Research US Drought Monitor API endpoints in detail

### Short-term (Weeks 2-3)
1. Set up project structure (`src/`, `tests/` directories)
2. Implement basic MCP server skeleton
3. Create mock API clients for testing
4. Implement first tool: `get_drought_current`

### Medium-term (Weeks 4-6)
1. Implement remaining MCP tools
2. Add real API client for US Drought Monitor
3. Implement schema transformations
4. Create comprehensive test suite

### Long-term (Weeks 7-8)
1. Integration testing with fire-behavior application
2. Performance optimization and caching
3. Documentation refinement
4. Production deployment preparation

## Questions & Decisions Needed

### API Access
- [ ] Confirm US Drought Monitor API is fully public (no authentication needed)
- [ ] Determine rate limits for USDM data services
- [ ] Identify backup data sources if primary unavailable

### Schema Integration
- [ ] Finalize drought-specific schema extensions
- [ ] Define how drought data merges with weather and wildfire data
- [ ] Determine priority when data sources conflict

### Testing
- [ ] Identify representative test locations for each drought category
- [ ] Define acceptable test coverage threshold (80%?)
- [ ] Plan for testing with historical drought data

## References

### Documentation
- README.md - Main project documentation
- .env.example - Configuration template
- package.json - Dependencies and scripts

### External Resources
- US Drought Monitor: https://droughtmonitor.unl.edu/
- NDMC Data API: https://usdmdataservices.unl.edu/api/
- fire-behavior repo: https://github.com/EliSchillinger/fire-behavior
- MCP Specification: https://github.com/anthropics/model-context-protocol

## How to Contribute

1. Review existing documentation (README.md)
2. Check this STATUS.md for current priorities
3. Choose a task from "In Progress" or "Not Started"
4. Create implementation following patterns from raws-mcp
5. Submit PR with documentation updates

## Contact

For questions about this project:
- Open an issue on GitHub
- Review related raws-mcp project for implementation patterns
- Check fire-behavior integration requirements

---

**Note:** This is a companion project to [raws-mcp](https://github.com/tyson-swetnam/raws-mcp), providing drought monitoring data to complement real-time weather observations for comprehensive wildfire risk assessment.
