import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { ListGroup, OverlayTrigger, Popover } from "react-bootstrap";

import { FaPen, FaTrash, FaEllipsisH } from "react-icons/fa";

import useHoverThread from "../../customHooks/useHoverThread";

import ThreadModal from "./ThreadModal";

function ThreadLink({ element, updateThreadList }) {
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEditButton, setShowEditButton] = useState(false);
  const [mode, setMode] = useState("rename");
  const [showPopover, setShowPopover] = useState(false);

  useHoverThread({ hovered, setHovered, ref });

  useEffect(() => {
    const minWidth = 768; // Minimum width for desktop devices
    setIsMobile(window.innerWidth < minWidth || screen.width < minWidth);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowEditButton(true); // alsway show edit button on mobile devices
    } else {
      setShowEditButton(hovered); // only show edit button on hover for desktop devices
    }
  }, [isMobile, hovered]);

  function changeToThread(thread) {
    browserHistory.push({
      pathname: "/chatbot/",
      search: `?thread_id=${thread}`,
    });
  }

  function togglePopover() {
    setShowPopover(!showPopover);
  }

  const threadOptions = [
    {
      title: "Rename",
      icon: <FaPen className="color" />,
    },
    {
      title: "Delete",
      icon: <FaTrash className="color" />,
    },
  ];

  const popover = (
    <Popover className="p-2">
      <ListGroup>
        {threadOptions.map((element, index) => {
          const itemKey = `options-${element.title}-${index}`;
          return (
            <ListGroup.Item
              className="px-4"
              action
              key={itemKey}
              role="button"
              onClick={() => {
                setMode(element.title.toLowerCase());
                togglePopover();
                setShowModal(true);
              }}
            >
              <span className="me-3">{element.icon}</span>
              {element.title}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Popover>
  );

  return (
    <>
      <ListGroup.Item
        className="px-0"
        ref={ref}
        onMouseEnter={() => setHovered(true)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <a
              href=""
              className="forced-textwrap"
              onClick={() => changeToThread(element.thread_id)}
            >
              {element.topic}
            </a>
          </div>

          <OverlayTrigger
            rootClose
            placement="right"
            trigger="click"
            show={showPopover}
            overlay={popover}
            onToggle={togglePopover}
          >
            {
              showEditButton ? (
                <div role="button" className="align-content-center color">
                  <FaEllipsisH />
                </div>
              ) : (
                <div className="align-content-center opacity-0">
                  <FaEllipsisH />
                </div>
              ) /* invisible icon to avoid layout shift */
            }
          </OverlayTrigger>
        </div>
      </ListGroup.Item>

      <ThreadModal
        mode={mode}
        showModal={showModal}
        setShowModal={setShowModal}
        element={element}
        updateThreadList={updateThreadList}
      />
    </>
  );
}

ThreadLink.propTypes = {
  element: PropTypes.object,
  updateThreadList: PropTypes.func,
};

export default ThreadLink;
