import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Alert,
  Form,
  Dropdown,
  ButtonGroup,
  Toast,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaGlobe,
  FaUser,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaEdit,
} from "react-icons/fa";

import { AVAILABLE_FACETS } from "./constants";

class FlavourManager extends Component {
  constructor(props) {
    super(props);

    this.state = {
      additionalFacetsVisible: false,
      showFlavourModal: false,
      editMode: false,
      originalFlavourName: "",
      deleteMode: false,
      showDeleteConfirmModal: false,
      flavourToDelete: null,
      flavourName: "",
      facetMappings: Object.fromEntries(
        AVAILABLE_FACETS.map((facet) => [facet.key, ""])
      ),
      isGlobal: false,
      modalError: "",
      modalLoading: false,
      showToast: false,
      toastMessage: "",
      toastVariant: "success",
    };

    this.handleSubmitFlavour = this.handleSubmitFlavour.bind(this);
    this.handleDeleteFlavour = this.handleDeleteFlavour.bind(this);
    this.handleEditFlavour = this.handleEditFlavour.bind(this);
  }

  showToast(message, variant = "success") {
    this.setState({
      showToast: true,
      toastMessage: message,
      toastVariant: variant,
    });
    setTimeout(() => this.setState({ showToast: false }), 3000);
  }

  handleEditFlavour(flavourDetail, event) {
    if (event) {
      event.stopPropagation();
    }

    const mappings = Object.fromEntries(
      AVAILABLE_FACETS.map((facet) => [
        facet.key,
        flavourDetail.mapping[facet.key] || "",
      ])
    );

    this.setState({
      showFlavourModal: true,
      editMode: true,
      originalFlavourName: flavourDetail.flavour_name,
      flavourName: flavourDetail.flavour_name,
      facetMappings: mappings,
      isGlobal: flavourDetail.owner === "global",
      modalError: "",
    });
  }

  async handleSubmitFlavour(e) {
    e.preventDefault();
    if (!this.state.flavourName.trim()) {
      this.setState({ modalError: "Flavour name is required" });
      return;
    }

    const mapping = {};
    Object.entries(this.state.facetMappings).forEach(([key, value]) => {
      if (value.trim()) {
        mapping[key] = value.trim();
      }
    });

    if (Object.keys(mapping).length === 0) {
      this.setState({ modalError: "At least one facet mapping is required" });
      return;
    }

    this.setState({ modalLoading: true });
    try {
      let result;
      if (this.state.editMode) {
        const updateData = {
          mapping,
          is_global: this.state.isGlobal,
        };
        // Reset the form on success and close the modal
        if (this.state.flavourName !== this.state.originalFlavourName) {
          updateData.flavour_name = this.state.flavourName;
        }

        result = await this.props.dispatch(
          this.props.updateFlavour(this.state.originalFlavourName, updateData)
        );
      } else {
        result = await this.props.dispatch(
          this.props.addFlavour({
            flavour_name: this.state.flavourName,
            mapping,
            is_global: this.state.isGlobal,
          })
        );
      }

      const message =
        result?.status ||
        (this.state.editMode
          ? "Flavour updated successfully!"
          : "Flavour added successfully!");
      this.showToast(message, "success");

      this.setState({
        flavourName: "",
        facetMappings: Object.fromEntries(
          AVAILABLE_FACETS.map((facet) => [facet.key, ""])
        ),
        isGlobal: false,
        modalError: "",
        showFlavourModal: false,
        editMode: false,
        originalFlavourName: "",
      });
    } catch (err) {
      const message =
        err.message ||
        `Failed to ${this.state.editMode ? "update" : "add"} flavour`;
      this.setState({ modalError: message });
      this.showToast(message, "danger");
    } finally {
      this.setState({ modalLoading: false });
    }
  }

  handleDeleteFlavour(flavourName, isGlobal, event = null) {
    if (event) {
      event.stopPropagation();
    }

    this.setState({
      showDeleteConfirmModal: true,
      flavourToDelete: { name: flavourName, isGlobal },
    });
  }

  confirmDeleteFlavour = () => {
    if (this.state.flavourToDelete) {
      this.performDeleteFlavour(
        this.state.flavourToDelete.name,
        this.state.flavourToDelete.isGlobal
      );
    }
    this.setState({
      showDeleteConfirmModal: false,
      flavourToDelete: null,
    });
  };

  cancelDeleteFlavour = () => {
    this.setState({
      showDeleteConfirmModal: false,
      flavourToDelete: null,
    });
  };

  async performDeleteFlavour(flavourName, isGlobal) {
    try {
      await this.props.dispatch(
        this.props.deleteFlavour(flavourName, isGlobal)
      );

      const currentFlavour =
        this.props.currentFlavour || this.props.defaultFlavour;
      if (currentFlavour === flavourName) {
        this.props.onFlavourClick("freva");
      }

      this.showToast("Flavour deleted successfully!", "success");
    } catch (err) {
      const canDelete = this.canDeleteFlavour({
        flavour_name: flavourName,
        owner: isGlobal ? "global" : "user",
      });

      let message;
      if (!canDelete) {
        if (isGlobal) {
          message = "Only administrators can delete global flavours";
        } else {
          message = "You don't have permission to delete this flavour";
        }
      } else {
        const serverMessage = err.message || "";
        if (serverMessage.toLowerCase().includes("create")) {
          message = "Failed to delete flavour - insufficient permissions";
        } else {
          message = serverMessage || "Failed to delete flavour";
        }
      }

      this.showToast(message, "danger");
    }
  }

  canDeleteFlavour(flavour) {
    const builtInFlavours = ["freva", "cmip5", "cmip6", "cordex", "user"];
    if (builtInFlavours.includes(flavour.flavour_name.toLowerCase())) {
      return false;
    }

    return true;
  }

  canAddFlavour() {
    return true;
  }

  getSortedFlavours() {
    // NOte: always global flavours are sorted first and then
    // user flavours
    const { flavourDetails } = this.props;
    if (!flavourDetails) {
      return [];
    }

    return [...flavourDetails].sort((a, b) => {
      if (a.owner === "global" && b.owner !== "global") {
        return -1;
      }
      if (a.owner !== "global" && b.owner === "global") {
        return 1;
      }
      return a.flavour_name.localeCompare(b.flavour_name);
    });
  }

  renderFlavourDropdown() {
    const sortedFlavours = this.getSortedFlavours();
    const flavour = this.props.currentFlavour || this.props.defaultFlavour;
    const currentFlavour = sortedFlavours.find(
      (f) => f.flavour_name === flavour
    );

    return (
      <>
        <style>{`
          .custom-dropdown-item.active .icon-white {
            color: white !important;
          }
          .dropdown-toggle-custom:hover {
            opacity: 0.9 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
          }
          .dropdown-toggle-custom:focus {
            box-shadow: 0 0 0 0.2rem rgba(3, 105, 161, 0.25) !important;
          }
          .flavour-action-btn {
            transition: all 0.2s ease;
          }
          .flavour-action-btn:hover {
            transform: scale(1.3);
          }
          .custom-dropdown-item:not(.active) .flavour-action-btn.edit-btn:hover {
            color: #0369a1 !important;
          }
          .custom-dropdown-item:not(.active) .flavour-action-btn.delete-btn:hover {
            color: #dc2626 !important;
          }
          .custom-dropdown-item.active .flavour-action-btn:hover {
            color: white !important;
          }
        `}</style>

        <div className="position-relative me-1">
          <ButtonGroup>
            <Dropdown
              onToggle={(isOpen) => {
                if (!isOpen) {
                  this.setState({ deleteMode: false });
                }
              }}
            >
              <Dropdown.Toggle
                variant="outline-secondary"
                id="flavour-dropdown"
                className="d-flex align-items-center dropdown-toggle-custom"
                style={{
                  minWidth: "120px",
                  fontSize: "0.9rem",
                }}
              >
                <div className="d-flex align-items-center w-100">
                  {currentFlavour?.owner === "global" ? (
                    <FaGlobe
                      className="me-2"
                      style={{
                        fontSize: "0.8rem",
                        color: "#0369a1",
                      }}
                    />
                  ) : (
                    <FaUser
                      className="me-2"
                      style={{
                        fontSize: "0.8rem",
                        color: "#475569",
                      }}
                    />
                  )}
                  <span className="text-truncate">{flavour}</span>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ minWidth: "160px" }}>
                {sortedFlavours.map((flavourDetail) => (
                  <div
                    key={flavourDetail.flavour_name}
                    className="position-relative"
                  >
                    <Dropdown.Item
                      active={flavour === flavourDetail.flavour_name}
                      onClick={() =>
                        this.props.onFlavourClick(flavourDetail.flavour_name)
                      }
                      className="d-flex align-items-center custom-dropdown-item"
                      style={{
                        paddingRight:
                          this.state.deleteMode &&
                          this.canDeleteFlavour(flavourDetail)
                            ? "75px"
                            : "16px",
                        fontSize: "0.9rem",
                      }}
                    >
                      {flavourDetail.owner === "global" ? (
                        <FaGlobe
                          className="text-primary me-2 icon-white"
                          style={{ fontSize: "0.8rem" }}
                        />
                      ) : (
                        <FaUser
                          className="text-secondary me-2 icon-white"
                          style={{ fontSize: "0.8rem" }}
                        />
                      )}
                      <span>{flavourDetail.flavour_name}</span>
                    </Dropdown.Item>

                    {this.state.deleteMode &&
                      this.canDeleteFlavour(flavourDetail) && (
                        <div
                          className="position-absolute"
                          style={{
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            gap: "4px",
                          }}
                        >
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 flavour-action-btn edit-btn"
                            onClick={(e) =>
                              this.handleEditFlavour(flavourDetail, e)
                            }
                            title="Edit flavour"
                            style={{
                              width: "20px",
                              height: "20px",
                              fontSize: "0.8rem",
                              color:
                                flavour === flavourDetail.flavour_name
                                  ? "white"
                                  : "#0369a1",
                            }}
                            onMouseEnter={(e) => {
                              if (flavour !== flavourDetail.flavour_name) {
                                e.currentTarget.style.color = "#0369a1";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                flavour === flavourDetail.flavour_name
                                  ? "white"
                                  : "#0369a1";
                            }}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger flavour-action-btn delete-btn"
                            onClick={(e) =>
                              this.handleDeleteFlavour(
                                flavourDetail.flavour_name,
                                flavourDetail.owner === "global",
                                e
                              )
                            }
                            title="Delete flavour"
                            style={{
                              width: "20px",
                              height: "20px",
                              fontSize: "0.8rem",
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      )}
                  </div>
                ))}

                <Dropdown.Divider />

                <Dropdown.Item
                  onClick={() =>
                    this.setState({
                      showFlavourModal: true,
                      editMode: false,
                      originalFlavourName: "",
                      flavourName: "",
                      facetMappings: Object.fromEntries(
                        AVAILABLE_FACETS.map((facet) => [facet.key, ""])
                      ),
                      isGlobal: false,
                      modalError: "",
                    })
                  }
                  className="text-success"
                  style={{ fontSize: "0.9rem" }}
                >
                  <FaPlus className="me-2" style={{ fontSize: "0.8rem" }} />
                  Add Flavour
                </Dropdown.Item>

                <Dropdown.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.setState({ deleteMode: !this.state.deleteMode });
                  }}
                  className={
                    this.state.deleteMode ? "text-danger" : "text-muted"
                  }
                  style={{ fontSize: "0.9rem" }}
                >
                  <FaTrash className="me-2" style={{ fontSize: "0.8rem" }} />
                  {this.state.deleteMode ? "Cancel Edit" : "Edit Mode"}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </ButtonGroup>

          <small
            className="position-absolute text-muted"
            style={{
              top: "-7px",
              left: "0px",
              backgroundColor:
                currentFlavour?.owner === "global" ? "#e0f2fe" : "#f1f5f9",
              padding: "0 4px",
              fontSize: "0.65rem",
              zIndex: 10,
              color: currentFlavour?.owner === "global" ? "#0369a1" : "#475569",
            }}
          >
            flavour
          </small>
        </div>
      </>
    );
  }

  renderDeleteConfirmModal() {
    const { flavourToDelete } = this.state;

    if (!flavourToDelete) {
      return null;
    }

    const isGlobal = flavourToDelete.isGlobal;
    const flavourName = flavourToDelete.name;

    return (
      <Modal
        show={this.state.showDeleteConfirmModal}
        onHide={this.cancelDeleteFlavour}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center text-danger">
            <FaExclamationTriangle className="me-2" />
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2">
          <div className="text-center">
            <div className="mb-3">
              <div
                className={`d-inline-flex align-items-center px-3 py-2 rounded ${
                  isGlobal
                    ? "bg-primary bg-opacity-10 border border-primary border-opacity-25"
                    : "bg-secondary bg-opacity-10 border border-secondary border-opacity-25"
                }`}
              >
                {isGlobal ? (
                  <FaGlobe className="text-primary me-2" />
                ) : (
                  <FaUser className="text-secondary me-2" />
                )}
                <strong>{flavourName}</strong>
                <small className="ms-2 text-muted">
                  ({isGlobal ? "Global" : "Personal"})
                </small>
              </div>
            </div>

            <p className="mb-0">
              Are you sure you want to delete this flavour?
            </p>

            {isGlobal && (
              <Alert variant="warning" className="mt-3 mb-0 small">
                <FaExclamationTriangle className="me-1" />
                This is a global flavour that affects all users!
              </Alert>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={this.cancelDeleteFlavour}
            className="px-4"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={this.confirmDeleteFlavour}
            className="px-4"
          >
            <FaTrash className="me-1" />
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderFlavourModal() {
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        this.setState({ showFlavourModal: false });
      }
    };

    if (!this.state.showFlavourModal) {
      return null;
    }

    return (
      <div className="token-modal show" onClick={handleBackdropClick}>
        <div
          className="token-modal-content"
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="token-header"
            style={{
              flexShrink: 0,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <h1>
              {this.state.editMode ? (
                <FaEdit className="me-2" style={{ fontSize: "18px" }} />
              ) : (
                <FaPlus className="me-2" style={{ fontSize: "18px" }} />
              )}
              {this.state.editMode ? "Edit Flavour" : "Flavour Management"}
            </h1>
            <p>
              {this.state.editMode
                ? "Update your flavour configuration"
                : "Create and manage data flavours for customized search experiences"}
            </p>
            <button
              className="token-close-btn"
              onClick={() => this.setState({ showFlavourModal: false })}
            >
              ×
            </button>
          </div>

          <div
            className="token-section"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              maxHeight: "calc(90vh - 160px)",
            }}
          >
            {/* Error Alert */}
            {this.state.modalError && (
              <div
                style={{
                  position: "sticky",
                  top: "-20px",
                  zIndex: 100,
                  marginBottom: "20px",
                }}
              >
                <Alert
                  variant="danger"
                  className="mb-0"
                  style={{
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#fecaca",
                    color: "#991b1b",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
                  }}
                >
                  {this.state.modalError}
                </Alert>
              </div>
            )}

            <div>
              <div className="token-status mb-3">
                <div className="token-label" style={{ fontSize: "18px" }}>
                  {this.state.editMode ? "Edit Flavour:" : "Add New Flavour:"}
                </div>
              </div>
              {/* Toggle and Flavour Row */}
              <Form onSubmit={this.handleSubmitFlavour}>
                <Row className="mb-3">
                  <Col md={12}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: "100px",
                          maxWidth: "100px",
                        }}
                      >
                        {/* Toggle on Left */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px",
                            background: this.state.isGlobal
                              ? "#f0f9ff"
                              : "#f8fafc",
                            border: `2px solid ${this.state.isGlobal ? "#0ea5e9" : "#e2e8f0"}`,
                            borderRadius: "10px",
                            transition: "all 0.3s ease",
                            cursor: this.state.editMode
                              ? "not-allowed"
                              : "pointer",
                            opacity: this.state.editMode ? 0.6 : 1,
                          }}
                          onClick={() => {
                            if (!this.state.editMode) {
                              this.setState({ isGlobal: !this.state.isGlobal });
                            }
                          }}
                        >
                          {/* Toggle Icon Display */}
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              background: this.state.isGlobal
                                ? "#0ea5e9"
                                : "#6b7280",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.3s ease",
                            }}
                          >
                            {this.state.isGlobal ? (
                              <FaGlobe
                                style={{
                                  fontSize: "12px",
                                  color: "white",
                                }}
                              />
                            ) : (
                              <FaUser
                                style={{
                                  fontSize: "12px",
                                  color: "white",
                                }}
                              />
                            )}
                          </div>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: this.state.isGlobal
                                ? "#0ea5e9"
                                : "#6b7280",
                              textAlign: "center",
                            }}
                          >
                            {this.state.isGlobal ? "Global" : "Personal"}
                          </span>
                          {/* Toggle Switch */}
                          <div
                            style={{
                              width: "36px",
                              height: "20px",
                              background: this.state.isGlobal
                                ? "#0ea5e9"
                                : "#cbd5e1",
                              borderRadius: "10px",
                              position: "relative",
                              transition: "all 0.3s ease",
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                background: "white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "2px",
                                left: this.state.isGlobal ? "18px" : "2px",
                                transition: "all 0.3s ease",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {this.state.isGlobal ? (
                                <FaGlobe
                                  style={{
                                    fontSize: "8px",
                                    color: "#0ea5e9",
                                  }}
                                />
                              ) : (
                                <FaUser
                                  style={{
                                    fontSize: "8px",
                                    color: "#6b7280",
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Flavour Input */}
                      <div style={{ flex: 1 }}>
                        <Form.Group>
                          <Form.Label
                            style={{
                              fontWeight: "600",
                              color: "#1e293b",
                              fontSize: "14px",
                              marginBottom: "6px",
                            }}
                          >
                            Flavour Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={this.state.flavourName}
                            onChange={(e) =>
                              this.setState({ flavourName: e.target.value })
                            }
                            placeholder="e.g., nextgem, custom_project"
                            style={{
                              border: "2px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "10px 12px",
                              fontSize: "14px",
                            }}
                            required
                          />

                          <div
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              marginTop: "4px",
                              fontStyle: "italic",
                            }}
                          >
                            {this.state.isGlobal
                              ? " Available to all users (requires admin permissions)"
                              : " Personal flavour"}
                          </div>
                        </Form.Group>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      fontWeight: "600",
                      color: "#1e293b",
                      fontSize: "14px",
                    }}
                  >
                    Facet Mappings
                  </Form.Label>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <Row>
                      {AVAILABLE_FACETS.map((facet) => (
                        <Col md={4} key={facet.key} className="mb-2">
                          <Form.Group>
                            <Form.Label
                              style={{
                                fontSize: "11px",
                                color: "#6b7280",
                                marginBottom: "4px",
                                fontWeight: "500",
                              }}
                            >
                              {facet.label}
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={this.state.facetMappings[facet.key]}
                              onChange={(e) =>
                                this.setState({
                                  facetMappings: {
                                    ...this.state.facetMappings,
                                    [facet.key]: e.target.value,
                                  },
                                })
                              }
                              placeholder={`Map ${facet.label.toLowerCase()}`}
                              style={{
                                fontSize: "12px",
                                padding: "6px 8px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "4px",
                              }}
                            />
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        fontStyle: "italic",
                        marginTop: "8px",
                        padding: "6px",
                        background: "white",
                        borderRadius: "4px",
                      }}
                    >
                      <strong>Example:</strong> For CMIP6 data, you might map
                      &quot;project&quot; to &quot;mip_era&quot;,
                      &quot;model&quot; to &quot;source_id&quot;, etc.
                    </div>
                  </div>
                </Form.Group>
              </Form>
            </div>
          </div>
          {/* Add Flavour Footer Buttons */}
          <div
            style={{
              flexShrink: 0,
              padding: "16px 20px",
              borderTop: "1px solid #e2e8f0",
              background: "white",
              borderRadius: "0 0 12px 12px",
            }}
          >
            <div className="token-actions" style={{ margin: 0 }}>
              <button
                type="button"
                className="token-btn"
                onClick={() => this.setState({ showFlavourModal: false })}
                style={{
                  background: "#6b7280",
                  fontSize: "14px",
                  padding: "10px 16px",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="token-btn"
                disabled={this.state.modalLoading}
                onClick={this.handleSubmitFlavour}
                style={{
                  opacity: this.state.modalLoading ? 0.6 : 1,
                  cursor: this.state.modalLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  padding: "10px 16px",
                }}
              >
                {this.state.modalLoading ? (
                  <>
                    <div
                      style={{
                        border: "2px solid #f3f4f6",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        width: "14px",
                        height: "14px",
                        animation: "spin 1s linear infinite",
                        marginRight: "6px",
                      }}
                    />
                    {this.state.editMode ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {this.state.editMode ? (
                      <FaEdit style={{ fontSize: "12px" }} />
                    ) : (
                      <FaPlus style={{ fontSize: "12px" }} />
                    )}
                    {this.state.editMode ? " Update Flavour" : " Add Flavour"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <>
        {this.renderFlavourDropdown()}
        {/* Flavour Modal */}
        {this.renderFlavourModal()}
        {this.renderDeleteConfirmModal()}
        {/* Toast notifications */}
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 11 }}>
          <Toast
            onClose={() => this.setState({ showToast: false })}
            show={this.state.showToast}
            delay={3000}
            style={{
              backgroundColor:
                this.state.toastVariant === "success" ? "#ddede5" : "#f8d7da",
            }}
            autohide
          >
            <Toast.Body>
              <strong>{this.state.toastMessage}</strong>
            </Toast.Body>
          </Toast>
        </div>
      </>
    );
  }
}

FlavourManager.propTypes = {
  flavourDetails: PropTypes.array,
  currentFlavour: PropTypes.string,
  defaultFlavour: PropTypes.string,
  currentUser: PropTypes.string,
  isAdmin: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
  addFlavour: PropTypes.func.isRequired,
  updateFlavour: PropTypes.func.isRequired,
  deleteFlavour: PropTypes.func.isRequired,
  onFlavourClick: PropTypes.func.isRequired,
};

export default FlavourManager;
