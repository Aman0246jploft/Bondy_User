"use client";
import React from "react";
import { useState, useRef } from "react";
import "./message.css";
import Link from "next/link";

function page() {
  const [activeChat, setActiveChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const msgEndRef = useRef();

  // --------------------------
  // PRE-LOADED MESSAGES HERE
  // --------------------------
  const [allMessages, setAllMessages] = useState([
    {
      text: "Hi, how are you all?",
      sender: "left",
      name: "Marina Jolly",
      img: "/img/chat_use02.png",
      time: "09:32",
    },
    {
      text: "Apologise guys, I’m having fever since 2 days.",
      sender: "left",
      name: "Marina Jolly",
      img: "/img/chat_use02.png",
      time: "09:33",
    },
    {
      text: "I just completed it last night.",
      sender: "me",
      name: "You",
      img: "/img/chat_use02.png",
      time: "09:34",
    },
  ]);

  const users = [
    {
      id: 1,
      name: "Marina Jolly",
      msg: "Marina is typing…..",
      time: "09:35",
      img: "/img/chat_use01.png",
      count: 2,
    },
    {
      id: 2,
      name: "Jackson Roy",
      msg: "Sent a picture",
      img: "/img/chat_use02.png",
    },
    {
      id: 3,
      name: "Hafsa Shaikh",
      msg: "Meet me before presentation……. ",
      img: "/img/chat_use03.png",
      count: 3,
    },
    {
      id: 4,
      name: "Hafsa Shaikh",
      msg: "Meet me before presentation……. ",
      img: "/img/chat_use04.png",
      count: 3,
    },
    {
      id: 5,
      name: "Hafsa Shaikh",
      msg: "Meet me before presentation……. ",
      img: "/img/chat_use05.png",
    },
    {
      id: 6,
      name: "Hafsa Shaikh",
      msg: "Meet me before presentation……. ",
      img: "/img/chat_use01.png",
      count: 3,
    },
    {
      id: 7,
      name: "Hafsa Shaikh",
      msg: "Meet me before presentation……. ",
      img: "/img/chat_use03.png",
    },
  ];

  // --------------------------
  // SEND MESSAGE
  // --------------------------
  const sendMessage = () => {
    if (!message.trim()) return;

    setAllMessages((prev) => [
      ...prev,
      {
        text: message,
        sender: "me",
        name: "You",
        img: "/img/my_dp.png",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    setShowGiftBox(false);

    setTimeout(() => {
      msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // When Chat Switch → Reset Dropdowns
  const openChat = (u) => {
    setActiveChat(u);
    setShowDropdown(false);
    setShowGiftBox(false);
  };

  return (
    <div>
      <div className="app-root">
        <div className="main-area">
          <div className="chat-wrapper container-fluid">
            <div className="row h-100">
              {/* LEFT CHAT LIST */}
              <div
                className={`col-lg-3 col-md-4 chat-sidebar ${
                  activeChat ? "mobile-hide" : ""
                }`}
              >
                <h4 className="title">Messages</h4>

                <div className="search-box">
                  <input type="text" placeholder="Search" />
                  <span className="search-icon">
                    {" "}
                    <img src="/img/search.svg" alt="" />
                  </span>
                </div>

                <div className="user-items">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => openChat(u)}
                      className={`user-chat-box ${
                        activeChat?.id === u.id ? "active" : ""
                      }`}
                    >
                      <img src={u.img} className="user-img" />
                      <div className="user-info">
                        <h5>{u.name}</h5>
                        <p>{u.msg}</p>
                      </div>

                      <div className="right-info">
                        {u.time && <small>{u.time}</small>}
                        {u.count && <span className="count">{u.count}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT CHAT WINDOW */}
              <div
                className={`col-lg-9 col-md-8 chat-window-area ${
                  activeChat ? "mobile-show" : ""
                }`}
              >
                {activeChat ? (
                  <div className="chat-window">
                    {/* HEADER */}
                    <div className="chat-header">
                      <span
                        className="back-btn"
                        onClick={() => setActiveChat(null)}
                      >
                        ←
                      </span>

                      <img src={activeChat.img} className="header-img" />

                      <div className="info">
                        <h5>{activeChat.name}</h5>
                        <small>Online</small>
                      </div>

                      <div
                        className="menu"
                        onClick={() => setShowDropdown(!showDropdown)}
                      >
                        ⋮
                      </div>

                      {showDropdown && (
                        <div className="options-dropdown">
                          <Link href="">
                            {" "}
                            <img src="/img/user-white.svg" className="me-2" />
                            User Profile
                          </Link>
                          <Link href="" className="block-user">
                            <img src="/img/close-white.svg" className="me-2" />
                            Block User
                          </Link>
                          <Link href="">
                            <img src="/img/mute-white.svg" className="me-2" />
                            Mute
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* MESSAGES */}
                    <div className="messages-area">
                      {allMessages.map((m, i) => (
                        <div
                          key={i}
                          className={`message ${
                            m.sender === "me" ? "right" : "left"
                          }`}
                        >
                          {/* USER PHOTO */}
                          <img src={m.img} className="msg-user-img" />

                          <div className="msg-box">
                            {/* MESSAGE BUBBLE */}
                            <div className="msg-meta">
                              <span className="msg-name">{m.name}</span>
                              <span className="msg-time">{m.time}</span>
                            </div>
                            <div className="msg-text">{m.text}</div>

                            {/* NAME + TIME */}
                          </div>
                        </div>
                      ))}

                      <div ref={msgEndRef} />
                    </div>

                    <div className="message-input">
                      <div className="icon-input-box">
                        <input
                          type="text"
                          placeholder="Your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />

                        <div className="action-icon-chat">
                          <button>
                            <img src="/img/voice_icon.svg" />
                          </button>
                          <div className="gift-area">
                            <span className="gift-icon">
                              <img src="/img/gift_icon.svg" />
                            </span>
                          </div>

                          {/* ATTACH */}
                          <label className="attach">
                            <img src="/img/attach_icon.svg" />
                            <input type="file" hidden />
                          </label>
                        </div>
                      </div>
                      <div className="icons">
                        <button onClick={sendMessage} className="send-btn">
                          <img src="/img/send_chat.svg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-chat-selected">
                    <img src="/img/logo.svg" />
                    Select a chat to start messaging
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
