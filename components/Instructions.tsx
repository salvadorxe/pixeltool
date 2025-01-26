import type React from "react"

const Instructions: React.FC = () => {
  return (
    <div className="bg-gray-50 px-8 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">How to use Pixel Stretcher</h2>
      <ul className="space-y-2 text-gray-600">
        <li className="flex items-center">
          <span className="mr-2 text-xl">1.</span>
          Upload an image using the "Upload Image" button
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-xl">2.</span>
          Adjust brush size using the slider or hold Shift and scroll up/down
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-xl">3.</span>
          Select stretch level: Light, Medium, or Heavy
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-xl">4.</span>
          Click and drag on the image to stretch pixels in any direction
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-xl">5.</span>
          Use the "Download Image" button to save your creation
        </li>
      </ul>
    </div>
  )
}

export default Instructions

