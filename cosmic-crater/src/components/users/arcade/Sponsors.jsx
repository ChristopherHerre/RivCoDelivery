import React, { useEffect, useState } from 'react';
import Spinner from '../Spinner';
function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [shuffledSponsors, setShuffledSponsors] = useState([]);
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Shuffle function (Fisher-Yates)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Fetch sponsors from your API on component mount
  useEffect(() => {
    async function fetchSponsors() {
      try {
        const response = await fetch('/api/sponsors');
        const data = await response.json();
        setSponsors(data);
        setShuffledSponsors(shuffleArray(data));
        setCurrentSponsorIndex(0);
      } catch (error) {
        console.error('Error fetching sponsors:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSponsors();
  }, []);

  // Set up the interval to rotate sponsors every 30 seconds
  useEffect(() => {
    if (shuffledSponsors.length === 0) return;
    setLoading(true);
    const interval = setInterval(() => {
      setCurrentSponsorIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= shuffledSponsors.length) {
          // All sponsors shown once, reshuffle
          const reshuffled = shuffleArray(shuffledSponsors);
          setShuffledSponsors(reshuffled);
          return 0;
        }
        return nextIndex;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [shuffledSponsors]);

  if (shuffledSponsors.length === 0) {
    return <Spinner />;
  }

  const currentSponsor = shuffledSponsors[currentSponsorIndex];

  return (
    <div className="bg-dark text-white p-3">
        {loading ? <Spinner /> :
        <div>
            <small>This game is sponsored by local businesses in Riverside County:</small>
            <h4 className="text-white">{currentSponsor.business_name}</h4>
            <small>{currentSponsor.phone_number}</small>
            <p>{currentSponsor.description}</p>
            {currentSponsor.website_url && (
                <a href={currentSponsor.website_url} target="_blank" rel="noopener noreferrer">
                Visit Website
                </a>
            )}
        </div>
        }
    </div>
  );
}

export default Sponsors;
