import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifyError } from '../utils/notify';
import {
  HiArrowRight,
  HiDesktopComputer,
  HiFilter,
  HiLibrary,
  HiLocationMarker,
  HiMusicNote,
  HiOfficeBuilding,
  HiPrinter,
  HiSearch,
  HiSparkles,
  HiSpeakerphone,
  HiUserGroup,
} from 'react-icons/hi';
import '../styles/workspacePages.css';

const typeMeta = {
  library: { icon: HiLibrary, spotlight: 'Quiet focus and revision ready' },
  computer_lab: { icon: HiDesktopComputer, spotlight: 'Ideal for coding and heavy software' },
  study_room: { icon: HiUserGroup, spotlight: 'Small team planning and project review' },
  discussion: { icon: HiUserGroup, spotlight: 'Talk-through collaboration without disruption' },
  seminar: { icon: HiSpeakerphone, spotlight: 'Presentation and workshop friendly' },
  music: { icon: HiMusicNote, spotlight: 'Sound-isolated rehearsal space' },
  '3d_print': { icon: HiPrinter, spotlight: 'Fabrication and prototyping support' },
};

const formatTypeLabel = (type) =>
  type
    ?.split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const FacilityBrowser = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get('/facilities/');
        const data = response.data.results || response.data;
        setFacilities(Array.isArray(data) ? data : []);
      } catch {
        notifyError('Failed to load facilities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const facilityTypes = useMemo(
    () => ['all', ...new Set(facilities.map((facility) => facility.type).filter(Boolean))],
    [facilities],
  );

  const filteredFacilities = useMemo(
    () =>
      facilities.filter((facility) => {
        if (!facility) {
          return false;
        }

        const searchValue = searchTerm.toLowerCase();
        const matchesSearch =
          (facility.name?.toLowerCase() || '').includes(searchValue) ||
          (facility.location?.toLowerCase() || '').includes(searchValue) ||
          (facility.type_display?.toLowerCase() || '').includes(searchValue);

        const matchesType = activeFilter === 'all' || facility.type === activeFilter;
        return matchesSearch && matchesType;
      }),
    [activeFilter, facilities, searchTerm],
  );

  const featuredFacility = filteredFacilities[0] || facilities[0] || null;
  const quietZones = facilities.filter((facility) => facility.type === 'library').length;
  const collaborationSpaces = facilities.filter((facility) =>
    ['study_room', 'discussion', 'seminar'].includes(facility.type),
  ).length;
  const specialtyLabs = facilities.filter((facility) =>
    ['computer_lab', 'music', '3d_print'].includes(facility.type),
  ).length;

  const kpiCards = [
    { label: 'Total Spaces', value: facilities.length, hint: 'Currently listed across campus', icon: HiOfficeBuilding },
    { label: 'Quiet Zones', value: quietZones, hint: 'Great for solo focus sessions', icon: HiLibrary },
    { label: 'Collaboration Rooms', value: collaborationSpaces, hint: 'Built for teamwork and discussion', icon: HiUserGroup },
    { label: 'Specialty Labs', value: specialtyLabs, hint: 'Tech, music, and maker spaces', icon: HiDesktopComputer },
  ];

  const hasFilters = activeFilter !== 'all' || searchTerm.trim().length > 0;

  return (
    <div className="workspace-page">
      <section className="workspace-hero">
        <div className="workspace-hero__content">
          <div className="workspace-hero__eyebrow">
            <HiSparkles />
            <span>Campus availability explorer</span>
          </div>

          <h1 className="workspace-hero__title">
            Find the right <span>space</span> before campus fills up.
          </h1>

          <p className="workspace-hero__description">
            Search libraries, labs, study rooms, and specialist spaces in one place. Filter by work
            mode, compare locations, and jump straight into booking when you find the right fit.
          </p>

          <div className="workspace-searchbar">
            <HiSearch />
            <input
              type="search"
              placeholder="Search by name, location, or space type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="workspace-hero__actions">
            <button
              type="button"
              className="workspace-button workspace-button--primary"
              onClick={() =>
                navigate(featuredFacility ? `/facilities/${featuredFacility.id}` : '/facilities')
              }
              disabled={!featuredFacility}
            >
              Open Featured Space
              <HiArrowRight />
            </button>

            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              disabled={!hasFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="workspace-hero__aside">
          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Featured right now</p>
            {featuredFacility ? (
              <>
                <h2 className="workspace-summary-card__value">{featuredFacility.name}</h2>
                <p className="workspace-summary-card__copy">
                  {typeMeta[featuredFacility.type]?.spotlight ||
                    'A strong choice for your next booking window.'}
                </p>
                <div className="workspace-inline-meta">
                  <span>{featuredFacility.type_display}</span>
                  <span>{featuredFacility.location}</span>
                </div>
                <button
                  type="button"
                  className="workspace-action-link"
                  onClick={() => navigate(`/facilities/${featuredFacility.id}`)}
                >
                  View Booking Page
                  <HiArrowRight />
                </button>
              </>
            ) : (
              <p className="workspace-summary-card__copy">
                Once facilities load, we will surface a featured space here for quick access.
              </p>
            )}
          </article>

          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Browse by mode</p>
            <div className="workspace-chip-grid">
              {facilityTypes
                .filter((type) => type !== 'all')
                .slice(0, 4)
                .map((type) => (
                  <div key={type} className="workspace-highlight-card">
                    <p className="workspace-highlight-card__eyebrow">{formatTypeLabel(type)}</p>
                    <h3 className="workspace-highlight-card__title">
                      {facilities.filter((facility) => facility.type === type).length}
                    </h3>
                    <p className="workspace-note">
                      {typeMeta[type]?.spotlight || 'A distinct workspace category on campus.'}
                    </p>
                  </div>
                ))}
            </div>
          </article>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.label} className="workspace-kpi-card">
            <div className="workspace-kpi-card__top">
              <div className="workspace-kpi-card__icon">
                <card.icon />
              </div>
            </div>
            <p className="workspace-kpi-card__label">{card.label}</p>
            <h2 className="workspace-kpi-card__value">{card.value}</h2>
            <p className="workspace-kpi-card__hint">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <h2 className="workspace-panel__title">Explore Spaces</h2>
            <p className="workspace-panel__description">
              Filter the catalog and open any facility to view live slot availability.
            </p>
          </div>
          <span className="workspace-panel__meta">
            {loading ? 'Loading catalog...' : `${filteredFacilities.length} result(s)`}
          </span>
        </div>

        <div className="workspace-panel__toolbar">
          <div className="workspace-filter-bar">
            {facilityTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`workspace-filter-chip${
                  activeFilter === type ? ' workspace-filter-chip--active' : ''
                }`}
                onClick={() => setActiveFilter(type)}
              >
                {type === 'all' ? 'All Spaces' : formatTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="workspace-results">
            <p>
              Showing <strong>{filteredFacilities.length}</strong> spaces
            </p>
            {hasFilters && (
              <button
                type="button"
                className="workspace-action-link"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
              >
                Reset search
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="workspace-card-grid workspace-card-grid--3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="workspace-skeleton" style={{ minHeight: '18rem' }} />
            ))}
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="workspace-empty-state">
            <div className="workspace-empty-state__icon">
              <HiFilter />
            </div>
            <h3>No facilities match this search</h3>
            <p>Try a different keyword, location, or space type to broaden the results.</p>
          </div>
        ) : (
          <div className="workspace-card-grid workspace-card-grid--3">
            {filteredFacilities.map((facility) => {
              const Icon = typeMeta[facility.type]?.icon || HiOfficeBuilding;

              return (
                <article key={facility.id} className="workspace-card">
                  <div className="workspace-card__header">
                    <div className="workspace-card__icon">
                      <Icon />
                    </div>
                    <span className="workspace-type-pill">{facility.type_display}</span>
                  </div>

                  <div className="workspace-card__meta">
                    <span>
                      <HiLocationMarker />
                      {facility.location}
                    </span>
                  </div>

                  <h3 className="workspace-card__title" style={{ marginTop: '1rem' }}>
                    {facility.name}
                  </h3>
                  <p className="workspace-card__description">
                    {facility.description ||
                      typeMeta[facility.type]?.spotlight ||
                      'Flexible university space for focused work and collaboration.'}
                  </p>

                  <div className="workspace-card__footer">
                    <span className="workspace-status-pill workspace-status-pill--success">
                      {facility.capacity_per_slot} seat{facility.capacity_per_slot === 1 ? '' : 's'} per slot
                    </span>
                    <button
                      type="button"
                      className="workspace-action-link"
                      onClick={() => navigate(`/facilities/${facility.id}`)}
                    >
                      Open
                      <HiArrowRight />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default FacilityBrowser;
