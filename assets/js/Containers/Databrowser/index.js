import React from "react";
import { connect } from "react-redux";
import { Container, Row, Col, Accordion, Card, Tooltip, OverlayTrigger, Button } from "react-bootstrap";

import { FaInfoCircle } from "react-icons/fa";
import _ from "lodash";

import NcdumpDialog from "../../Components/NcdumpDialog";
import AccordionItemBody from "../../Components/AccordionItemBody";
import OwnPanel from "../../Components/OwnPanel";
import Spinner from "../../Components/Spinner";

import { loadFacets, selectFacet, clearFacet, clearAllFacets, setActiveFacet, setMetadata, loadFiles,
  loadNcdump, resetNcdump } from "./actions";

class Databrowser extends React.Component {

  constructor (props) {
    super(props);
    this.state = { showDialog: false, fn: null };
  }

  /**
     * On mount we load all facets and files to display
     * Also load the metadata.js script
     */
  componentDidMount () {
    this.props.dispatch(loadFacets());
    this.props.dispatch(loadFiles());
    const script = document.createElement("script");
    script.src = "/static/js/metadata.js";
    script.async = true;
    script.onload = () => this.props.dispatch(setMetadata({ variable: window.variable, model: window.model, institute: window.institute }));
    document.body.appendChild(script);
  }

  /**
     * Loop all facets and render the panels
     */
  renderFacetPanels () {
    const { facets, selectedFacets, activeFacet, metadata } = this.props.databrowser;
    const { dispatch } = this.props;
    return _.map(facets, (value, key) => {
      let panelHeader;
      const isFacetSelected = !!selectedFacets[key];
      if (isFacetSelected) {
        panelHeader = <span>{key}: <strong>{selectedFacets[key]}</strong></span>;
      } else if (value.length === 2) {
        panelHeader = <span>{key}: <strong>{value[0]}</strong></span>;
      } else {
        const numberOfValues = value.length / 2;
        panelHeader = <span>{key} ({numberOfValues})</span>;
      }
      return (
        <OwnPanel
          header={panelHeader} eventKey={key} key={key} removeFacet={isFacetSelected ? (() => dispatch(clearFacet(key))) : null}
          collapse={() => dispatch(setActiveFacet(key))}
        >
          <AccordionItemBody
            eventKey={key} value={value} facetClick={(key, item) => dispatch(selectFacet(key, item))}
            metadata={metadata[key] ? metadata[key] : null} visible={key === activeFacet}
          />
        </OwnPanel>
      );
    });
  }

  renderFilesPanel () {
    //TODO: This should be a separate component
    const { activeFacet, files, numFiles, } = this.props.databrowser;
    const { dispatch } = this.props;
    return (
      <Accordion activeKey={activeFacet}>
        <OwnPanel
          header={<span> Files [{numFiles}]</span>}
          eventKey="files"
          collapse={() => dispatch(setActiveFacet("files"))}
        >
          <div style={{ maxHeight:500,overflow:"auto" }}>
            <ul className="jqueryFileTree">
              {
                _.map(files, (fn) => {
                  return (
                    <li className="ext_nc" key={fn} style={{ whiteSpace: "normal" }}>
                      <OverlayTrigger overlay={<Tooltip>Click to execute &apos;ncdump -h&apos;<br />and view metadata</Tooltip>}>
                        <Button variant="link" className="p-0" onClick={() => {this.setState({ showDialog: true, fn });}}>
                          <FaInfoCircle className="ncdump" />
                        </Button>
                      </OverlayTrigger>
                      {" "}{fn}
                    </li>
                  );
                })
              }
            </ul>
          </div>
        </OwnPanel>
      </Accordion>
    );
  }

  render () {
    const { files, facets, selectedFacets, activeFacet, ncdumpStatus, ncdumpOutput } = this.props.databrowser;
    const { dispatch } = this.props;

    // Wait until facets are loaded
    if (facets.length === 0) {
      return (
        <Spinner />
      );
    }

    const facetPanels = this.renderFacetPanels();

    return (
      <Container>
        <Row>
          <Col md={12}>
            <h2>Data-Browser</h2>
          </Col>
        </Row>
        <Row>
          {
            Object.keys(selectedFacets).length !== 0 ?
              <Col md={12}>
                <Card className="p-2">
                  <a href="#" onClick={(e) => {e.preventDefault(); dispatch(clearAllFacets());}}>Clear all</a>
                </Card>
              </Col> : null
          }
        </Row>
        <Row>
          <Col md={12}>
            <Accordion activeKey={activeFacet}>
              {facetPanels}
            </Accordion>

            <Card className="mt-2 p-2">
              freva --databrowser
              {
                _.map(selectedFacets, (value, key) => {
                  return <span key={`command-${key}`}> {key}=<strong>{value}</strong></span>;
                })
              }
            </Card>

            {this.renderFilesPanel()}

            <NcdumpDialog
              show={this.state.showDialog}
              file={this.state.fn}
              onClose={() => {this.setState({ showDialog: false }); dispatch(resetNcdump());}}
              submitNcdump={(fn, pw) => dispatch(loadNcdump(fn, pw))}
              status={ncdumpStatus}
              output={ncdumpOutput}
            />
          </Col>
        </Row>
      </Container>
    );
  }

}

const mapStateToProps = state => ({
  databrowser: state.databrowserReducer
});

export default connect(mapStateToProps)(Databrowser);
