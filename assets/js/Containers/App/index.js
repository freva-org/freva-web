import React from "react";
import { connect } from "react-redux";

import Spinner from "../../Components/Spinner";

import { getCurrentUser } from "./actions";

class App extends React.Component {

  componentDidMount () {
    this.props.dispatch(getCurrentUser());
  }

  render () {

    // Wait until the current user is loaded
    if (!this.props.state.appReducer.currentUser && this.props.state.appReducer.error === "") {
      return (
        <Spinner />
      );
    }

    return (
      <React.Fragment>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  state
});

export default connect(mapStateToProps)(App);
