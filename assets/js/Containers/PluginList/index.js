import React from "react";
import PropTypes from "prop-types";
import { browserHistory } from "react-router";
import { connect } from "react-redux";
import {
  Row, Col, Button, ListGroup, ListGroupItem, Container, Modal, ButtonGroup, FormCheck,
  FormGroup, FormLabel, FormControl, InputGroup
} from "react-bootstrap";

import _ from "lodash";

import FileTree from "../../Components/FileTree";
import { fetchDir, closeDir, changeRoot } from "../../Components/FileTree/actions";

import Spinner from "../../Components/Spinner";

import { exportPlugin, loadPlugins, updateCategoryFilter, updateTagFilter, updateSearchFilter } from "./actions";

/*
These are the hardcoded categories of this group. If a category is not listed here, the
corresponding plugins will not be shown
FIXME: Is this actually a good idea?
*/
const categoryTitle = {
  decadal: "Decadal Evaluation",
  statistical: "Statistical Analysis",
  postproc: "Post-Processing",
  support: "Support Plugins",
  other: "Others"
};

class PluginList extends React.Component {

  constructor (props) {
    super(props);
    this.handleExport = this.handleImport.bind(this);
    this.handleSearchFilter = this.handleSearchFilter.bind(this);
    this.handlePluginValue = this.handlePluginValue.bind(this);
    this.renderCategoryCheckbox = this.renderCategoryCheckbox.bind(this);

    this.state = {
      showModal: false,
      value: "",
    };
  }

  componentDidMount () {
    this.props.dispatch(loadPlugins());
  }

  handleImport () {
    this.props.dispatch(exportPlugin(this.state.value));
    this.setState({ showModal: false });
  }

  handleSearchFilter (e) {
    this.props.dispatch(updateSearchFilter(e.target.value));
  }

  handlePluginValue (e) {
    this.setState({ value: e.target.value });
  }

  renderPluginBlock (filteredPlugins, category) {
    const plugins = _.filter(filteredPlugins, (val) => {
      return val[1].category.toLowerCase() === category;
    });

    if (plugins.length <= 0) {
      return null;
    }
    return (
      <ListGroup className="mb-3" key={category + "plugins"}>
        <ListGroupItem>
          <h3 className="mb-0">{categoryTitle[category]}</h3>
        </ListGroupItem>
        {
          plugins.map(val => {
            return (
              <ListGroupItem
                className="shadow-sm"
                action
                onClick={
                  (e) => {
                    e.preventDefault(); browserHistory.push(`/plugins/${val[0]}/detail/`);
                  }
                }
                href={`/plugins/${val[0]}/detail/`}
                key={val[0]}
              >
                <div className="fs-5">{val[1].name}</div>
                {
                  val[1].user_exported ?
                    <span className="text-danger">You have plugged in this tool.<br /></span> : null
                }
                {val[1].description}
              </ListGroupItem>
            );
          })
        }
      </ListGroup>
    );
  }

  renderCategoryCheckbox (categories, categoriesFilter, categoryName) {
    if (!categories[categoryName]) {
      return null;
    }

    return (
      <FormCheck key={categoryName + "checkbox"}>
        <FormCheck.Input
          type="checkbox"
          onChange={() => this.props.dispatch(updateCategoryFilter(categoryName))}
          checked={_.includes(categoriesFilter, categoryName)}
          id={categoryName + "-cat"}
        />
        <FormCheck.Label
          htmlFor={categoryName + "-cat"}
        >
          {categoryTitle[categoryName]} ({categories[categoryName].length})
        </FormCheck.Label>
      </FormCheck>
    );
  }

  render () {
    const {
      exported,
      tags,
      categories,
      categoriesFilter,
      tagsFilter,
      filteredPlugins,
      searchFilter,
      pluginsLoaded
    } = this.props.pluginList;

    const { nodes, root, error } = this.props.fileTree;
    const { currentUser, dispatch } = this.props;
    let children;
    if (nodes && nodes.length > 0) {
      children = nodes.map(n => {
        return (
          <FileTree
            node={n}
            key={n.name}
            extension="py"
            handleOpen={
              (e, path) => {
                e.preventDefault(); this.props.dispatch(fetchDir(path, "py"));
              }
            }
            handleClose={
              (e, path) => {
                e.preventDefault(); this.props.dispatch(closeDir(path));
              }
            }
            handleFileClick={
              (e, path) => {
                e.preventDefault(); this.setState({ value:path });
              }
            }
          />
        );
      });
    } else if (error) {
      children = (
        <div className="text-danger">
          {error}
        </div>
      );
    }

    if (!pluginsLoaded) {
      return (
        <Spinner />
      );
    }
    return (
      <Container>
        <Row>
          <Col md={6}><h2>Plugins</h2></Col>
          <Col md={6} className="pt-2">
            {
              !currentUser.isGuest && currentUser.home ?
                <Button
                  variant="info" className="float-end"
                  onClick={() => (exported ? this.props.dispatch(exportPlugin()) : this.setState({ showModal: true }))}
                >
                  {exported ? "Remove imported Plugin" : "Plug-my-Plugin"}
                </Button> : null
            }
          </Col>
        </Row>

        <Row>
          <Col md={8} className="mt-3">
            {
              Object.keys(categoryTitle).map(key => {
                return this.renderPluginBlock(filteredPlugins, key);
              })
            }
          </Col>

          <Col md={4}>
            <InputGroup className="mt-3">
              <FormControl
                type="text" value={searchFilter}
                onChange={this.handleSearchFilter}
                placeholder="Search for plugins"
              />
            </InputGroup>

            <div className="mt-2">
              <FormLabel>Categories:</FormLabel>
              <div>
                {
                  Object.keys(categoryTitle).map(key => {
                    return this.renderCategoryCheckbox(categories, categoriesFilter, key);
                  })
                }
              </div>
            </div>
            <div className="mt-2">
              <FormLabel>Tags:</FormLabel>
              <div className="d-flex flex-wrap justify-content-between">
                {
                  tags.map(tag => {
                    return (
                      <Button
                        className="badge mb-2 me-2" variant={_.includes(tagsFilter, tag) ? "success" : "secondary"}
                        key={tag}
                        onClick={() => dispatch(updateTagFilter(tag))}
                      >
                        {tag}
                      </Button>
                    );
                  })
                }
              </div>
            </div>
          </Col>
        </Row>

        <Modal
          show={this.state.showModal}
          onShow={() => this.props.dispatch(changeRoot({ id: "home", path: currentUser.home }, "py"))}
          onHide={() => this.setState({ showModal: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>Plug-in your own plugin</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Here you can plugin your own plugin</p>
            <ButtonGroup className="mb-2">
              <Button
                variant="primary" active={root.id === "home"}
                onClick={() => this.props.dispatch(changeRoot({ id: "home", path: currentUser.home }, "py"))}
              >
                Home
              </Button>
              <Button
                variant="primary" active={root.id === "scratch"}
                onClick={() => this.props.dispatch(changeRoot({ id: "scratch", path: currentUser.scratch }, "py"))}
              >
                Scratch
              </Button>
            </ButtonGroup>
            {children}
            <FormGroup style={{ marginTop: 10 }}>
              <FormLabel>File to plugin</FormLabel>
              <FormControl
                type="text" value={this.state.value}
                onChange={this.handlePluginValue}
              />
            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={() => this.handleExport()}>Import Plugin</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }
}

PluginList.propTypes = {
  pluginList: PropTypes.shape({
    exported: PropTypes.bool,
    tags: PropTypes.array,
    categories: PropTypes.object,
    categoriesFilter: PropTypes.array,
    tagsFilter: PropTypes.array,
    filteredPlugins: PropTypes.array,
    searchFilter: PropTypes.string,
    pluginsLoaded: PropTypes.bool
  }),
  fileTree: PropTypes.shape({
    nodes: PropTypes.array,
    root: PropTypes.shape({
      id: PropTypes.string
    }),
    error: PropTypes.string
  }),
  currentUser: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    email: PropTypes.string,
    isGuest: PropTypes.bool,
    home: PropTypes.string,
    scratch: PropTypes.string
  }),
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  pluginList: state.pluginListReducer,
  fileTree: state.fileTreeReducer,
  currentUser: state.appReducer.currentUser
});

export default connect(mapStateToProps)(PluginList);
