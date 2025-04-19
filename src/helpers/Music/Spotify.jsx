import React, { useState } from 'react'

function Spotify() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="spotify-player fixed top-2 right-2 z-50 transition-all select-none  duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <iframe 
        style={{ 
          borderRadius: "12px",
          transition: "height ease-in-out",
          height: isHovered ? "400px" : "100px",
          userSelect: "none"
        }} 
        src="https://open.spotify.com/embed/playlist/472lp5jLXqtjwIRgYTOKTO?utm_source=generator&theme=0" 
        width="400" 
        frameBorder="0" 
        allowFullScreen="" 
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      ></iframe>
    </div>
  )
}

export default Spotify
