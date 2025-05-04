import "./index.css";

import { PencilLine, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useState } from "react";

const Template = () => {
  const [chatInput, setChatInput] = useState("");
  const [tasks, setTasks] = useState(["", "", ""]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTaskChange = (index, value) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleAddTask = () => {
    setTasks([...tasks, ""]);
  };

  return (
    <div className="min-h-screen bg-[var(--primary-color-orange)] text-black fade-in flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 pt-8 px-4 w-full text-center">
        Goal: {location.state?.goal}
      </h1>
      <div className="flex flex-wrap md:gap-16 gap-4 w-full md:p-16 p-4">
        <div className="bg-white rounded-lg p-6 text-black mb-6 flex-auto w-[500px]">
          <h2 className="text-lg mb-4 w-auto">Your habits to track</h2>
          {tasks.map((task, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                className="w-full border-b border-gray-300 focus:outline-none focus:border-[var(--primary-color-orange)] pb-2"
                placeholder="Enter your habit"
                value={task}
                onChange={(e) => handleTaskChange(index, e.target.value)}
              />
            </div>
          ))}
          <button
            onClick={handleAddTask}
            className="text-[var(--primary-color-teal)] text-2xl font-bold cursor-pointer"
          >
            <Plus className="hover:stroke-[var(--primary-color-orange)]" />
          </button>
        </div>

        <div className="mb-6 flex-auto w-[400px]">
          <h2 className="text-lg mb-2 text-center">
            Tell us more about your goal and desired outcome{" "}
            <PencilLine className="inline-block" />
          </h2>
          <textarea
            className="w-full h-48 border rounded-lg p-3 text-black focus:outline-2 focus:outline-offset-1 focus:outline-[#2626268a] bg-white"
            placeholder="Type your message here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button
            onClick={() => console.log("clicked")}
            className="save-button mt-4"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Template;
