import React, { useState } from "react";
import PropTypes from "prop-types";

import { Form, Collapse, Button } from "react-bootstrap";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

/**
 * Aggregation configuration component
 * Allows users to configure how multiple
 * files should be aggregated
 */
export function AggregationConfig({ onChange, initialConfig = {} }) {
  const [config, setConfig] = useState({
    aggregate: initialConfig.aggregate || "auto",
    join: initialConfig.join || null,
    compat: initialConfig.compat || null,
    data_vars: initialConfig.data_vars || null,
    coords: initialConfig.coords || null,
    dim: initialConfig.dim || "",
    group_by: initialConfig.group_by || "",
    reload: initialConfig.reload || false,
    access_pattern: initialConfig.access_pattern || "map",
    chunk_size: initialConfig.chunk_size || 16.0,
    map_primary_chunksize: initialConfig.map_primary_chunksize || 1,
    ...initialConfig,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field, value) => {
    const newConfig = {
      ...config,
      [field]: value === "" ? null : value,
    };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <div className="aggregation-config">
      {/* Basic Aggregation Mode */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Aggregation Method</Form.Label>
        <Form.Select
          size="sm"
          value={config.aggregate || "auto"}
          onChange={(e) => handleChange("aggregate", e.target.value)}
        >
          <option value="auto">Auto (Detect automatically)</option>
          <option value="merge">Merge (Combine variables)</option>
          <option value="concat">Concat (Join along dimension)</option>
        </Form.Select>
        <Form.Text className="text-muted">
          Auto mode will automatically detect the best aggregation method
        </Form.Text>
      </Form.Group>

      {/* Advanced Options Toggle */}
      <Button
        variant="link"
        size="sm"
        className="p-0 mb-3 text-decoration-none"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <FaChevronDown /> : <FaChevronRight />}
        <span className="ms-2">Advanced Options</span>
      </Button>

      {/* Advanced Options */}
      <Collapse in={showAdvanced}>
        <div>
          {/* Dimension (for concat mode) */}
          {config.aggregate === "concat" && (
            <Form.Group className="mb-3">
              <Form.Label>Dimension to Concatenate Along</Form.Label>
              <Form.Control
                type="text"
                size="sm"
                placeholder="e.g., time, ensemble"
                value={config.dim || ""}
                onChange={(e) => handleChange("dim", e.target.value)}
              />
              <Form.Text className="text-muted">
                Leave empty to create a new dimension
              </Form.Text>
            </Form.Group>
          )}

          {/* Join Mode */}
          <Form.Group className="mb-3">
            <Form.Label>Join Mode</Form.Label>
            <Form.Select
              size="sm"
              value={config.join || ""}
              onChange={(e) => handleChange("join", e.target.value)}
            >
              <option value="">Default</option>
              <option value="outer">Outer (Union)</option>
              <option value="inner">Inner (Intersection)</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="exact">Exact (Must match)</option>
            </Form.Select>
          </Form.Group>

          {/* Compatibility Mode */}
          <Form.Group className="mb-3">
            <Form.Label>Compatibility Mode</Form.Label>
            <Form.Select
              size="sm"
              value={config.compat || ""}
              onChange={(e) => handleChange("compat", e.target.value)}
            >
              <option value="">Default</option>
              <option value="no_conflicts">No Conflicts</option>
              <option value="equals">Equals</option>
              <option value="override">Override</option>
            </Form.Select>
          </Form.Group>

          {/* Data Variables */}
          <Form.Group className="mb-3">
            <Form.Label>Data Variables Handling</Form.Label>
            <Form.Select
              size="sm"
              value={config.data_vars || ""}
              onChange={(e) => handleChange("data_vars", e.target.value)}
            >
              <option value="">Default</option>
              <option value="minimal">Minimal</option>
              <option value="different">Different</option>
              <option value="all">All</option>
            </Form.Select>
          </Form.Group>

          {/* Coordinates */}
          <Form.Group className="mb-3">
            <Form.Label>Coordinates Handling</Form.Label>
            <Form.Select
              size="sm"
              value={config.coords || ""}
              onChange={(e) => handleChange("coords", e.target.value)}
            >
              <option value="">Default</option>
              <option value="minimal">Minimal</option>
              <option value="different">Different</option>
              <option value="all">All</option>
            </Form.Select>
          </Form.Group>

          {/* Group By */}
          <Form.Group className="mb-3">
            <Form.Label>Group By (Optional)</Form.Label>
            <Form.Control
              type="text"
              size="sm"
              placeholder="e.g., ensemble, variable"
              value={config.group_by || ""}
              onChange={(e) => handleChange("group_by", e.target.value)}
            />
            <Form.Text className="text-muted">
              Group files by a specific attribute
            </Form.Text>
          </Form.Group>
          {/* Reload Cache */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Force Reload (bypass cache)"
              checked={config.reload || false}
              onChange={(e) => handleChange("reload", e.target.checked)}
            />
            <Form.Text className="text-muted">
              Force server to fetch fresh data instead of using cached version
            </Form.Text>
          </Form.Group>

          {/* Access Pattern */}
          <Form.Group className="mb-3">
            <Form.Label>Access Pattern Optimization</Form.Label>
            <Form.Select
              size="sm"
              value={config.access_pattern || "map"}
              onChange={(e) => handleChange("access_pattern", e.target.value)}
            >
              <option value="map">Map (spatial slices)</option>
              <option value="time_series">Time Series (temporal slices)</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Optimize chunk layout for your typical data access pattern
            </Form.Text>
          </Form.Group>

          {/* Chunk Size */}
          <Form.Group className="mb-3">
            <Form.Label>Target Chunk Size (MB)</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              step="0.1"
              min="1"
              max="1000"
              value={config.chunk_size || 16.0}
              onChange={(e) =>
                handleChange("chunk_size", parseFloat(e.target.value))
              }
            />
            <Form.Text className="text-muted">
              Target size for data chunks (default: 16 MB)
            </Form.Text>
          </Form.Group>

          {/* Map Primary Chunksize - only map */}
          {config.access_pattern === "map" && (
            <Form.Group className="mb-3">
              <Form.Label>Primary Dimension Chunk Size</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                min="1"
                value={config.map_primary_chunksize || 1}
                onChange={(e) =>
                  handleChange(
                    "map_primary_chunksize",
                    parseInt(e.target.value)
                  )
                }
              />
              <Form.Text className="text-muted">
                Number of time steps per chunk (for map access pattern)
              </Form.Text>
            </Form.Group>
          )}
        </div>
      </Collapse>
    </div>
  );
}

AggregationConfig.propTypes = {
  onChange: PropTypes.func.isRequired,
  initialConfig: PropTypes.object,
};

export default AggregationConfig;
