import React from 'react';
import {connect} from 'react-redux';
import { getCurrentUser } from './actions'
import Spinner from "../../Components/Spinner";

class App extends React.Component {
 
  componentDidMount() {
      this.props.dispatch(getCurrentUser())
  }

  render() {

    // Wait until the current user is loaded
    if (!this.props.state.appReducer.currentUser){
        return (
          <Spinner />
        )
    }

    return (
        <React.Fragment>
            {this.props.children}
        </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({
    state: state
});

export default connect(mapStateToProps)(App);
