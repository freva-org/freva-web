import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import { browserHistory } from "react-router";

import { ListGroup, OverlayTrigger, Popover } from "react-bootstrap";

import { FaPen, FaTrash, FaEllipsisV } from "react-icons/fa";

import useHoverThread from "../../customHooks/useHoverThread";
import useMobileStatus from "../../customHooks/useMobileStatus";
import { grepThreadID } from "../../utils";

import ThreadModal from "./ThreadModal";

function ThreadLink({ element, updateThreadList }) {
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [showEditButton, setShowEditButton] = useState(false);
  const [mode, setMode] = useState("rename");
  const [showPopover, setShowPopover] = useState(false);
  const [activeLink, setActiveLink] = useState(false);
  const isMobile = useMobileStatus();

  useHoverThread({ hovered, setHovered, ref });

  useEffect(() => {
    if (isMobile) {
      setShowEditButton(true); // alsway show edit button on mobile devices
    } else {
      setShowEditButton(hovered); // only show edit button on hover for desktop devices
    }
  }, [isMobile, hovered]);

  useEffect(() => {
    if (grepThreadID() === element.thread_id) {
      setActiveLink(true);
    }
  }, []);

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
      icon: <FaPen color="grey" />,
    },
    {
      title: "Delete",
      icon: <FaTrash color="grey" />,
    },
  ];

  const popover = (
    <Popover className="p-2">
      <ListGroup className="bot-shadow br-8">
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
      <div
        className={
          hovered | activeLink ? "p-2 br-8 bot-shadow bot-bg-lg" : "p-2 br-8"
        }
        ref={ref}
        onMouseEnter={() => setHovered(true)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <a
              href=""
              className="forced-textwrap bot-chat-link"
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
                <div role="button" className="align-content-center">
                  <FaEllipsisV color="grey" />
                </div>
              ) : (
                <div className="align-content-center opacity-0">
                  <FaEllipsisV color="grey" />
                </div>
              ) /* invisible icon to avoid layout shift */
            }
          </OverlayTrigger>
        </div>
      </div>

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
