import React from 'react';
import ReactDOM from 'react-dom';
import { Link, browserHistory } from 'react-router';
import {connect} from 'react-redux';
import {
    Row, Col, Button, ListGroup, ListGroupItem, Container, Modal, ButtonGroup, FormCheck,
    FormGroup, FormLabel, FormControl, InputGroup
} from 'react-bootstrap';
import FileTree from '../../Components/FileTree';
import {fetchDir, closeDir, changeRoot} from '../../Components/FileTree/actions';
import {exportPlugin, loadPlugins, updateCategoryFilter, updateTagFilter, updateSearchFilter} from './actions';
import _ from 'lodash';
import Spinner from "../../Components/Spinner"

/*
These are the hardcodet categories of this group. If a category is not listed here, the
corresponding plugins will not be shown
FIXME: Is this actually a good idea?
*/
const categoryTitle = {
    decadal: 'Decadal Evaluation',
    statistical: 'Statistical Analysis',
    postproc: 'Post-Processing',
    support: 'Support Plugins',
    other: 'Others'
};

class PluginList extends React.Component {

    constructor(props) {
        super(props);
        this.handleExport = this.handleExport.bind(this);
        this.renderCategoryCheckbox = this.renderCategoryCheckbox.bind(this);

        this.state = {
            showModal: false,
            value: '',
        };
    }

    componentDidMount() {
        this.props.dispatch(loadPlugins());
    }

    handleExport() {
        this.props.dispatch(exportPlugin(this.state.value));
        this.setState({showModal: false})
    }

    renderPluginBlock(filteredPlugins, category) {
        let plugins = _.filter(filteredPlugins, (val) => {
                return val[1].category.toLowerCase() === category;
            });

        if (plugins.length <= 0) {
            return null;
        }
        return (
            <ListGroup key={category + "plugins"}>
                <ListGroupItem>
                    <h3>{categoryTitle[category]}</h3>
                </ListGroupItem>
                {plugins.map(val => {
                    return (
                        <ListGroupItem
                                       action
                                       onClick={(e) => {e.preventDefault(); browserHistory.push(`/plugins/${val[0]}/detail/`)}}
                                       href={`/plugins/${val[0]}/detail/`}
                                       key={val[0]}>
                            <div className="fs-5">{val[1].name}</div>
                            {val[1].user_exported ?
                                <span className="text-danger">You have plugged in this tool.<br/></span> : null}
                            {val[1].description}
                        </ListGroupItem>
                    )
                })}
            </ListGroup>
        );
    }

    renderCategoryCheckbox(categories, categoriesFilter, categoryName) {
        if (!categories[categoryName]) {
            return null;
        }

        return (
            <FormCheck key={categoryName + "checkbox"}>
                    <FormCheck.Input
                        type="checkbox"
                        onChange={() => this.props.dispatch(updateCategoryFilter(categoryName))}
                        checked={_.includes(categoriesFilter, categoryName)}
                        id={categoryName + '-cat'}
                    />
                    <FormCheck.Label
                        htmlFor={categoryName + '-cat'}
                    >
                        {categoryTitle[categoryName]} ({categories[categoryName].length})
                    </FormCheck.Label>
            </FormCheck>
        );
    }

    render() {
        let {exported, tags, categories, categoriesFilter, tagsFilter, filteredPlugins, searchFilter,
             pluginsLoaded} = this.props.pluginList;
        const {nodes, root} = this.props.fileTree;
        const {currentUser, dispatch} = this.props;

        let childs = nodes.map(n =>
            <FileTree node={n}
                      key={n.name}
                      extension="py"
                      handleOpen={(e, path) => {e.preventDefault(); this.props.dispatch(fetchDir(path, "py"))}}
                      handleClose={(e, path) => {e.preventDefault(); this.props.dispatch(closeDir(path))}}
                      handleFileClick={(e, path) => {e.preventDefault(); this.setState({value:path})}}/>
        );

        if (!pluginsLoaded) {
            return (
                <Spinner />
            )
        }
         return (
             <Container>
                 <Row>
                     <Col md={6}><h2>Plugins</h2></Col>
                     <Col md={6} className="pt-2">
                         {!currentUser.isGuest ?
                         <Button variant="info" className="float-end"
                                 onClick={() => exported ? this.props.dispatch(exportPlugin()) : this.setState({showModal: true}) }>
                             {exported ? 'Remove exported Plugin' : 'Plug-my-Plugin'}
                         </Button> : null}
                     </Col>
                 </Row>

                 <Row>
                     <Col md={8} className="mt-3">
                        {
                            Object.keys(categoryTitle).map(key => {
                              return this.renderPluginBlock(filteredPlugins, key)
                            })
                        }
                     </Col>

                     <Col md={4}>
                         <InputGroup className="mt-3">
                             <FormControl type="text" ref="searchInput" value={searchFilter}
                                          onChange={() => dispatch(updateSearchFilter(ReactDOM.findDOMNode(this.refs.searchInput).value))}
                                          placeholder="Search for plugins"/>
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
                                               <Button className="badge mb-2 me-2" variant={_.includes(tagsFilter, tag) ? "success" : 'secondary'}
                                                    key={tag}
                                                    onClick={() => dispatch(updateTagFilter(tag))}
                                                >
                                                  {tag}
                                               </Button>
                                        )
                                     })
                                 }
                             </div>
                         </div>
                     </Col>
                 </Row>

                 <Modal show={this.state.showModal}
                        onShow={() => this.props.dispatch(changeRoot({id: 'home', path: currentUser.home}, 'py'))}
                        onHide={() => this.setState({showModal: false})}>
                     <Modal.Header closeButton>
                         <Modal.Title>Plug-in your own plugin</Modal.Title>
                     </Modal.Header>
                     <Modal.Body>
                         <p>Here you can plugin your own plugin</p>
                         <ButtonGroup style={{marginBottom: 10}}>
                             <Button variant="primary" active={root.id === 'home'}
                                     onClick={() => this.props.dispatch(changeRoot({id: 'home', path: currentUser.home}, 'py'))}>
                                 Home
                             </Button>
                             <Button variant="primary" active={root.id === 'scratch'}
                                     onClick={() => this.props.dispatch(changeRoot({id: 'scratch', path: currentUser.scratch}, 'py'))}>
                                 Scratch
                             </Button>
                         </ButtonGroup>
                         {childs}
                         <FormGroup style={{marginTop: 10}}>
                             <FormLabel>File to plugin</FormLabel>
                             <FormControl type="text" ref="input" value={this.state.value}
                                          onChange={() => this.setState({value: ReactDOM.findDOMNode(this.refs.input).value})}/>
                         </FormGroup>
                     </Modal.Body>

                     <Modal.Footer>
                         <Button variant="primary" onClick={() => this.handleExport()}>Export Plugin</Button>
                     </Modal.Footer>
                 </Modal>
             </Container>
         )
    }
}

const mapStateToProps = state => ({
    pluginList: state.pluginListReducer,
    fileTree: state.fileTreeReducer,
    currentUser: state.appReducer.currentUser
});

export default connect(mapStateToProps)(PluginList);
