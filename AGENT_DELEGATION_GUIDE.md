# Agent Delegation Guide - Drought MCP Implementation

**Quick Reference for Delegating Implementation Tasks**

---

## Current Status

- ✅ **Phase 0**: Complete (Documentation and Planning)
- 🚀 **Phase 1**: READY TO START (Core MCP Server Infrastructure)
- ⏳ **Phases 2-7**: Pending

**Project Structure**: `/Users/tswetnam/github/drought-mcp/`
- ✅ src/ directory created with subdirectories
- ✅ tests/ directory created with subdirectories
- ❌ NO implementation code exists yet

---

## Phase 1: Core MCP Server Setup (START HERE)

**Status**: Ready to delegate
**Duration**: 2-3 days
**Priority**: CRITICAL - All other work depends on this

### Task 1.1: MCP Server Entry Point
**Delegate to**: `@mcp-node-engineer`

**Command**:
```
@mcp-node-engineer Please implement the MCP server entry point at src/index.js
following the specifications in IMPLEMENTATION_COORDINATION.md Phase 1, Task 1.1.

Create a basic MCP server that:
- Uses @modelcontextprotocol/sdk (Server, StdioServerTransport)
- Registers with name "drought" and version "1.0.0"
- Sets up tool registration system
- Handles ListToolsRequestSchema and CallToolRequestSchema
- Implements graceful shutdown
- Includes comprehensive logging

This is the foundation for the entire drought-mcp server.
```

### Task 1.2 & 1.3: Configuration and Logging
**Delegate to**: `@software-engineer`

**Command**:
```
@software-engineer Please implement the configuration and logging infrastructure:

1. Create src/config.js:
   - Load environment variables from .env using dotenv
   - Export configuration object with defaults (see IMPLEMENTATION_COORDINATION.md Phase 1, Task 1.2)
   - Validate configuration on load

2. Create src/logger.js:
   - Use Winston for structured logging
   - Configure console transport with colors
   - Support log levels: error, warn, info, debug
   - Export singleton logger instance (see Phase 1, Task 1.3)

These are foundational utilities needed by all other modules.
```

### Task 1.4: Basic Health Check Tool
**Delegate to**: `@mcp-node-engineer`

**Command** (after Tasks 1.1-1.3 complete):
```
@mcp-node-engineer Please implement the health check tool at src/tools/health.js
following IMPLEMENTATION_COORDINATION.md Phase 1, Task 1.4.

Create a simple MCP tool that:
- Tool name: "health_check"
- Returns server status, version, uptime
- Uses standardized tool response format
- Can be called via MCP protocol

Then register this tool in src/index.js to verify the tool registration system works.
```

### Phase 1 Validation
**Run after all Phase 1 tasks complete**:
```bash
# 1. Install dependencies
npm install

# 2. Test server startup
node src/index.js

# 3. Register in Claude Desktop config:
# ~/.Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "drought": {
      "command": "node",
      "args": ["/Users/tswetnam/github/drought-mcp/src/index.js"]
    }
  }
}

# 4. Restart Claude Desktop and test health_check tool
```

**Success Criteria**:
- [ ] Server starts without errors
- [ ] Registers with Claude Desktop
- [ ] health_check tool returns valid response
- [ ] Logging works correctly
- [ ] Configuration loads properly

---

## Phase 2: GeoJSON and Location Processing

**Status**: Depends on Phase 1 completion
**Duration**: 3-4 days
**Priority**: HIGH

### Recommended Delegation Order:

1. **Tasks 2.1, 2.2, 2.6** (Foundation):
   ```
   @software-engineer Please implement the GeoJSON infrastructure:

   1. src/geojson/downloader.js (Task 2.1)
   2. src/geojson/cache.js (Task 2.2)
   3. src/utils/fips.js (Task 2.6)

   See IMPLEMENTATION_COORDINATION.md Phase 2 for detailed specifications.
   These are the foundation for GeoJSON processing.
   ```

2. **Task 2.3** (Critical GeoJSON Processing):
   ```
   @mcp-node-engineer Please implement the point-in-polygon processor at
   src/geojson/processor.js (Task 2.3).

   This requires @turf/turf expertise for accurate drought severity detection
   from USDM GeoJSON data. See IMPLEMENTATION_COORDINATION.md Phase 2, Task 2.3.
   ```

3. **Tasks 2.4, 2.5** (Location Resolution):
   ```
   @software-engineer Please implement location resolution:

   1. src/location/geocoder.js (Task 2.4)
   2. src/location/resolver.js (Task 2.5)

   These modules convert location strings to coordinates for drought lookup.
   See IMPLEMENTATION_COORDINATION.md Phase 2, Tasks 2.4-2.5.
   ```

### Phase 2 Validation
```javascript
// Test script: test-phase2.js
import { resolveLocation } from './src/location/resolver.js';
import { getDroughtSeverity } from './src/geojson/processor.js';
import { downloadGeoJSON } from './src/geojson/downloader.js';

const location = await resolveLocation({ location: "Boulder, CO" });
const geojson = await downloadGeoJSON('current');
const severity = getDroughtSeverity(location.latitude, location.longitude, geojson);
console.log(`Boulder, CO drought severity: ${severity}`);
```

---

## Phase 3: API Client Implementation

**Status**: Can run parallel with Phase 2
**Duration**: 3-4 days
**Priority**: HIGH

### Recommended Delegation:

**All tasks to `@software-engineer`** (or split between engineers):
```
@software-engineer Please implement the API client infrastructure:

1. src/api/base-client.js (Task 3.1) - Foundation HTTP client
2. src/api/cache.js (Task 3.4) - API response caching
3. src/api/rate-limiter.js (Task 3.5) - Rate limiting
4. src/api/usdm-client.js (Task 3.2) - USDM GeoJSON client
5. src/api/ndmc-client.js (Task 3.3) - NDMC Data Services client

See IMPLEMENTATION_COORDINATION.md Phase 3 for detailed specifications.
Create these in order (1-3 are foundations for 4-5).
```

**OR** delegate foundation separately:
```
@mcp-node-engineer Please implement the base HTTP client with retry logic
at src/api/base-client.js (Phase 3, Task 3.1). This will be extended by
USDM and NDMC clients.
```

---

## Phase 4: Schema Transformation

**Status**: Depends on Phases 2 & 3
**Duration**: 2-3 days
**Priority**: HIGH

### Recommended Delegation:

1. **Schemas and Validators**:
   ```
   @mcp-node-engineer Please implement the schema infrastructure:

   1. src/schemas/drought-schema.js (Task 4.1) - Zod schemas for drought data
   2. src/schemas/wildfire-schema.js (Task 4.2) - Wildfire template schemas

   See IMPLEMENTATION_COORDINATION.md Phase 4, Tasks 4.1-4.2.
   ```

2. **Risk Calculator** (domain expertise):
   ```
   @drought-data-interpreter Please implement the drought risk calculator at
   src/utils/risk-calculator.js (Task 4.4).

   This requires your domain expertise to correctly map drought severity (D0-D4)
   to wildfire risk contribution (0-50 points), considering area coverage and
   duration. See IMPLEMENTATION_COORDINATION.md Phase 4, Task 4.4.
   ```

3. **Transformer**:
   ```
   @mcp-node-engineer Please implement the data transformer at
   src/schemas/transformer.js (Task 4.3).

   Transform USDM drought data to wildfire_prompt_template.json format.
   See IMPLEMENTATION_COORDINATION.md Phase 4, Task 4.3.
   ```

4. **Validators**:
   ```
   @software-engineer Please implement input validators at
   src/utils/validators.js (Task 4.5).

   Validate coordinates, dates, state codes, drought severity codes, FIPS codes.
   See IMPLEMENTATION_COORDINATION.md Phase 4, Task 4.5.
   ```

---

## Phase 5: MCP Tool Implementation

**Status**: Depends on Phases 1-4
**Duration**: 3-4 days
**Priority**: CRITICAL

### Recommended Delegation:

**All tools to `@mcp-node-engineer`** (MCP expertise required):

```
@mcp-node-engineer Please implement all four MCP tools:

1. src/tools/get-current.js (Task 5.1) - Current drought conditions
2. src/tools/get-by-area.js (Task 5.2) - State/regional drought statistics
3. src/tools/get-historical.js (Task 5.3) - Historical drought trends
4. src/tools/get-statistics.js (Task 5.4) - Statistical analysis

Also create src/tools/index.js (Task 5.5) to export all tools.

See IMPLEMENTATION_COORDINATION.md Phase 5 for detailed specifications.

After implementation, register all tools in src/index.js and test via
Claude Desktop.
```

**OR** implement sequentially:
```
@mcp-node-engineer Please implement get_drought_current tool first at
src/tools/get-current.js (Phase 5, Task 5.1). This is the most critical
tool and will validate the complete integration.
```

---

## Phase 6: Testing

**Status**: Ongoing, finalizes after Phase 5
**Duration**: 2-3 days
**Priority**: HIGH

### Recommended Delegation:

**All testing to `@software-engineer`**:
```
@software-engineer Please implement comprehensive test suite:

1. tests/fixtures/ - Create sample USDM GeoJSON and API responses (Task 6.6)
2. tests/mocks/ - Create API response mocks (Task 6.6)
3. tests/unit/api-clients.test.js (Task 6.1)
4. tests/unit/geojson-processor.test.js (Task 6.2)
5. tests/unit/transformers.test.js (Task 6.3)
6. tests/unit/tools.test.js (Task 6.4)

See IMPLEMENTATION_COORDINATION.md Phase 6 for specifications.

Goal: Achieve 80%+ test coverage.
```

**Integration tests to `@mcp-node-engineer`**:
```
@mcp-node-engineer Please implement integration tests at
tests/integration/mcp-tools.test.js (Task 6.5).

Test complete tool execution flow with realistic scenarios.
See IMPLEMENTATION_COORDINATION.md Phase 6, Task 6.5.
```

---

## Phase 7: Final Validation

**Status**: Depends on all previous phases
**Duration**: 1-2 days
**Priority**: CRITICAL

### Recommended Delegation:

1. **End-to-End Testing**:
   ```
   @project-architect Please coordinate end-to-end testing (Phase 7, Task 7.1):
   - Test all tools via Claude Desktop
   - Verify real USDM data retrieval
   - Validate wildfire schema compliance
   - Test error scenarios
   - Verify caching and performance
   ```

2. **Code Quality**:
   ```
   @mcp-node-engineer Please perform code quality check (Phase 7, Task 7.3):
   - Run ESLint on all code
   - Fix linting issues
   - Review code consistency
   - Verify JSDoc completeness
   - Check error handling patterns
   ```

3. **Documentation**:
   ```
   @documentation-writer Please verify and update documentation (Phase 7, Task 7.2):
   - Update README.md with any implementation changes
   - Verify all tool examples work
   - Add troubleshooting section
   - Document known limitations
   - Update STATUS.md
   ```

4. **Performance Validation**:
   ```
   @mcp-node-engineer Please validate performance (Phase 7, Task 7.4):
   - Test GeoJSON loading performance
   - Test point-in-polygon query speed
   - Verify caching effectiveness
   - Optimize if needed
   - Document performance characteristics
   ```

---

## Quick Delegation Commands

### Start Phase 1 (DO THIS FIRST):
```
@mcp-node-engineer Create src/index.js MCP server entry point (Phase 1, Task 1.1)
@software-engineer Create src/config.js and src/logger.js (Phase 1, Tasks 1.2-1.3)
```

### After Phase 1 Complete:
```
@software-engineer Start Phase 2 GeoJSON infrastructure (Tasks 2.1, 2.2, 2.6)
@software-engineer Start Phase 3 API clients (Tasks 3.1-3.5)
```

### After Phase 2 & 3 Complete:
```
@mcp-node-engineer Implement Phase 4 schemas (Tasks 4.1-4.2)
@drought-data-interpreter Implement Phase 4 risk calculator (Task 4.4)
```

### After Phase 4 Complete:
```
@mcp-node-engineer Implement all Phase 5 MCP tools (Tasks 5.1-5.5)
@software-engineer Start Phase 6 testing (Tasks 6.1-6.6)
```

### After Phase 5 Complete:
```
@project-architect Coordinate Phase 7 final validation
```

---

## Critical Success Factors

1. **Phase 1 MUST complete first** - Nothing else can proceed without the MCP server foundation
2. **Phases 2 and 3 can run in parallel** - Different teams/agents can work simultaneously
3. **Phase 4 requires Phases 2 & 3** - Schema transformation needs both GeoJSON and API data
4. **Phase 5 requires Phases 1-4** - Tools integrate everything
5. **Testing (Phase 6) should start early** - Write tests as modules complete
6. **Phase 7 is final validation** - Production readiness check

---

## Communication Pattern

When delegating, always include:
1. **Agent name**: e.g., `@mcp-node-engineer`
2. **Task reference**: Phase number and task number
3. **File path**: Exact file location
4. **Documentation reference**: Point to IMPLEMENTATION_COORDINATION.md section
5. **Dependencies**: What must exist before this task can start

**Example**:
```
@mcp-node-engineer Please implement the MCP server entry point.

File: src/index.js
Reference: IMPLEMENTATION_COORDINATION.md Phase 1, Task 1.1
Dependencies: None (this is the foundation)

Create a basic MCP server that uses @modelcontextprotocol/sdk, registers
as "drought" v1.0.0, and handles tool registration. See documentation
for complete specifications.
```

---

## Integration Checkpoints

After each phase, run validation:

**Phase 1**: `node src/index.js` should start server
**Phase 2**: Test drought lookup for Boulder, CO
**Phase 3**: Test API calls to real USDM endpoints
**Phase 4**: Verify wildfire schema output
**Phase 5**: Test all tools via Claude Desktop
**Phase 6**: `npm test` should pass with 80%+ coverage
**Phase 7**: Complete end-to-end test in production-like environment

---

## References

- **Master Plan**: `/Users/tswetnam/github/drought-mcp/IMPLEMENTATION_COORDINATION.md`
- **Implementation Details**: `/Users/tswetnam/github/drought-mcp/docs/implementation_plan.md`
- **API Documentation**: `/Users/tswetnam/github/drought-mcp/docs/api_endpoints.md`
- **Project Status**: `/Users/tswetnam/github/drought-mcp/STATUS.md`

---

**Ready to Start**: Phase 1 can begin immediately
**Next Action**: Delegate Phase 1, Task 1.1 to @mcp-node-engineer
