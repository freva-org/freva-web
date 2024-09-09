import React from 'react';
import { Card } from 'react-bootstrap';

import { browserHistory } from "react-router";

import { recentRequests } from './constants';


function SidePanel() {

    function changeToThread(thread) {
        browserHistory.push({
            pathname: '/chatbot/',
            search: `?thread_id=${thread}`
        });
    }

    return(
        <Card className="mb-3 shadow-sm">
            <div className="btn btn-outline-secondary border-0 p-3 rounded-top text-start card-header shadow-sm button-div">
                Recent requests
            </div>
            <div className="p-3 py-2 collapse show">
                {recentRequests.map((element, index) => {
                    return(
                        <div key={index}>
                            <a className="text-wrap" href="" onClick={() => changeToThread(element.thread)}>
                                {element.title}
                            </a>
                        </div>
                        
                    );
                })}
            </div>
                
      </Card>
        
    );
}

export default SidePanel;