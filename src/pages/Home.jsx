import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { trackEvent } from '@microsoft/feature-management-applicationinsights-browser';
import { AppContext } from './AppContext';

function Home() {
  const { appInsights, featureManager, currentUser } = useContext(AppContext);
  const [liked, setLiked] = useState(false);
  const [variant, setVariant] = useState(undefined);

  useEffect(() => {
    const init = async () => {  
      const variant = await featureManager?.getVariant("Greeting", { userId: currentUser });
      setVariant(variant);
      setLiked(false);
    };

    init();
  }, [featureManager, currentUser]);

  const handleClick = () => {
    if (!liked) {
      const targetingId = currentUser;
      trackEvent(appInsights, targetingId, { name: "Like" });
    }
    setLiked(!liked);
  };

  return (
    <div className="quote-card">
      { variant ?
        ( 
        <>
          <h2>
            { variant.name === "On" ? 
              ( <>Hi <b>{currentUser ?? "Guest"}</b>, hope this makes your day!</> ) :
              ( <>Quote of the day</> ) }
          </h2>
          <blockquote>
            <p>"You cannot change what you are, only what you do."</p>
            <footer>— Philip Pullman</footer>
          </blockquote>
          <div className="vote-container">
            <button className="heart-button" onClick={handleClick}>
              {liked ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
        </> 
        ) 
        : <p>Loading</p>       
      }
    </div>
  );
}

export default Home;