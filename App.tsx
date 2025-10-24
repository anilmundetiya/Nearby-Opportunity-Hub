import React, { useState, useCallback, useEffect } from 'react';
import { findCompanies } from './services/geminiService';
import type { Company, GroundingSource, GeolocationCoordinates } from './types';
import CompanyCard from './components/CompanyCard';
import LoadingSpinner from './components/LoadingSpinner';
import SourceLink from './components/SourceLink';

const App: React.FC = () => {
  const [locationInput, setLocationInput] = useState<string>('');
  const [jobRoleInput, setJobRoleInput] = useState<string>('Software Development');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [userCoords, setUserCoords] = useState<GeolocationCoordinates | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('techHubSearchHistory');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load search history from localStorage", error);
    }
  }, []);

  const handleSearch = useCallback(async (searchLocation: string, searchJobRole: string) => {
    if (!searchLocation.trim()) {
      setError('Please enter a location.');
      return;
    }
    if (!searchJobRole.trim()) {
      setError('Please enter a job role or sector.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCompanies([]);
    setSources([]);

    try {
      const { companies: foundCompanies, sources: foundSources } = await findCompanies(searchLocation, searchJobRole, userCoords);
      
      // Update history on successful search, avoiding "My Current Location"
      if (searchLocation.trim().toLowerCase() !== 'my current location') {
        setSearchHistory(prevHistory => {
            const newHistory = [
                searchLocation, 
                ...prevHistory.filter(item => item.toLowerCase() !== searchLocation.toLowerCase())
            ].slice(0, 5); // Limit to 5 recent searches
            localStorage.setItem('techHubSearchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
      }

      if(foundCompanies.length === 0) {
        setError("No companies found for this location and job role. Try being more specific or broader.");
      }
      setCompanies(foundCompanies);
      setSources(foundSources);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [userCoords]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        setLocationInput('My Current Location');
        handleSearch('my current location', jobRoleInput);
      },
      () => {
        setError('Unable to retrieve your location. Please enter it manually.');
        setIsLoading(false);
      }
    );
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('techHubSearchHistory');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Nearby Opportunity Hub
          </h1>
          <p className="mt-4 text-lg text-slate-400">Discover companies and job opportunities near you.</p>
        </header>

        <div className="max-w-2xl mx-auto bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="location-input" className="block text-sm font-medium text-slate-400 mb-2">Location</label>
              <input
                id="location-input"
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter a city, state, or address..."
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(locationInput, jobRoleInput)}
                disabled={isLoading}
                aria-label="Location"
              />
            </div>
            <div>
              <label htmlFor="job-role-input" className="block text-sm font-medium text-slate-400 mb-2">Job Role / Sector</label>
              <input
                id="job-role-input"
                type="text"
                value={jobRoleInput}
                onChange={(e) => setJobRoleInput(e.target.value)}
                placeholder="e.g., Marketing, Finance, Teaching..."
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(locationInput, jobRoleInput)}
                disabled={isLoading}
                aria-label="Job Role or Sector"
              />
            </div>
            <button
                onClick={() => handleSearch(locationInput, jobRoleInput)}
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                Search
            </button>
            <button
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-cyan-400 font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Use My Current Location
            </button>
          </div>
          
          {searchHistory.length > 0 && !isLoading && (
            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Locations</h4>
                    <button 
                        onClick={handleClearHistory} 
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Clear recent searches"
                    >
                        Clear
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item, index) => (
                        <button
                            key={`${item}-${index}`}
                            onClick={() => {
                                setLocationInput(item);
                                handleSearch(item, jobRoleInput);
                            }}
                            disabled={isLoading}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm py-1 px-3 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          {isLoading && <LoadingSpinner />}
          {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>}
          
          {!isLoading && companies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((company, index) => (
                <CompanyCard key={index} company={company} />
              ))}
            </div>
          )}

          {!isLoading && sources.length > 0 && (
            <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-xl font-semibold text-slate-300 mb-4">Sources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {sources.map((source, index) => (
                   <SourceLink key={index} source={source} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && companies.length === 0 && !error && (
            <div className="text-center text-slate-500 mt-16">
              <p>Enter a location and job role to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;