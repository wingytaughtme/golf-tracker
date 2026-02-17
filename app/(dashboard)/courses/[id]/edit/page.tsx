'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Types
interface HoleData {
  hole_number: number;
  par: number;
  handicap_index: number;
}

interface NineData {
  name: string;
  nine_type: 'front' | 'back' | 'named';
  display_order: number;
  holes: HoleData[];
}

interface NineRating {
  nine_name: string;
  course_rating: number;
  slope_rating: number;
}

interface HoleYardage {
  nine_name: string;
  hole_number: number;
  yardage: number;
}

interface TeeSetData {
  name: string;
  color: string;
  nine_ratings: NineRating[];
  hole_yardages: HoleYardage[];
}

interface WizardData {
  name: string;
  city: string;
  state: string;
  zip_code: string;
  address: string;
  course_type: '' | 'public' | 'private' | 'resort' | 'municipal';
  num_nines: number;
  nines: NineData[];
  tee_sets: TeeSetData[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const TEE_COLORS = [
  { name: 'Black', value: 'black', bg: 'bg-charcoal', text: 'text-white' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600', text: 'text-white' },
  { name: 'White', value: 'white', bg: 'bg-white border border-card-border', text: 'text-charcoal' },
  { name: 'Gold', value: 'gold', bg: 'bg-secondary', text: 'text-charcoal' },
  { name: 'Red', value: 'red', bg: 'bg-red-600', text: 'text-white' },
  { name: 'Green', value: 'green', bg: 'bg-primary', text: 'text-white' },
];

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Course details' },
  { id: 2, name: 'Scorecard', description: 'Holes & tees' },
  { id: 3, name: 'Review', description: 'Confirm & save' },
];

const getTeeColorStyles = (colorValue: string) => {
  const color = TEE_COLORS.find(c => c.value === colorValue);
  return color || { bg: 'bg-cream-300', text: 'text-charcoal' };
};

export default function CourseEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    city: '',
    state: '',
    zip_code: '',
    address: '',
    course_type: '',
    num_nines: 2,
    nines: [],
    tee_sets: [],
  });

  // Load existing course data
  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Course not found');
          }
          throw new Error('Failed to load course');
        }

        const data = await response.json();

        // Check if user can edit this course
        if (data.source !== 'user_created') {
          throw new Error('Cannot edit seeded courses');
        }

        // Transform API data to wizard format
        const nines: NineData[] = data.nines.map((nine: {
          name: string;
          nine_type: string;
          display_order: number;
          holes: { hole_number: number; par: number; handicap_index: number }[];
        }) => ({
          name: nine.name,
          nine_type: nine.nine_type as 'front' | 'back' | 'named',
          display_order: nine.display_order,
          holes: nine.holes.map((h: { hole_number: number; par: number; handicap_index: number }) => ({
            hole_number: h.hole_number,
            par: h.par,
            handicap_index: h.handicap_index,
          })),
        }));

        // Transform tee sets - need to extract nine ratings and hole yardages
        const teeSets: TeeSetData[] = data.tee_sets.map((teeSet: {
          name: string;
          color: string;
          nine_ratings: { nine_id: string; course_rating: number; slope_rating: number }[];
          holes: { id: string; hole_number: number; distance: number }[];
        }) => {
          // Map nine_id to nine_name for ratings
          const nineRatings: NineRating[] = teeSet.nine_ratings.map((r: { nine_id: string; course_rating: number; slope_rating: number }) => {
            const nine = data.nines.find((n: { id: string; name: string }) => n.id === r.nine_id);
            return {
              nine_name: nine?.name || '',
              course_rating: r.course_rating,
              slope_rating: r.slope_rating,
            };
          });

          // Build hole yardages from the holes data
          // Holes are numbered 1-18, need to map back to nine + hole_number
          const holeYardages: HoleYardage[] = teeSet.holes.map((h: { hole_number: number; distance: number }) => {
            // Determine which nine this hole belongs to
            const nineIndex = Math.floor((h.hole_number - 1) / 9);
            const nine = nines[nineIndex];
            const holeNumInNine = ((h.hole_number - 1) % 9) + 1;
            return {
              nine_name: nine?.name || '',
              hole_number: holeNumInNine,
              yardage: h.distance,
            };
          });

          return {
            name: teeSet.name,
            color: teeSet.color,
            nine_ratings: nineRatings,
            hole_yardages: holeYardages,
          };
        });

        setWizardData({
          name: data.name,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code || '',
          address: data.address || '',
          course_type: data.course_type || '',
          num_nines: nines.length,
          nines,
          tee_sets: teeSets,
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

  // Validation
  const isTeeSetValid = useCallback((teeSet: TeeSetData) => {
    return (
      teeSet.name.trim() !== '' &&
      teeSet.color !== '' &&
      teeSet.nine_ratings.length === wizardData.nines.length &&
      teeSet.nine_ratings.every(r => r.course_rating >= 25 && r.course_rating <= 45 && r.slope_rating >= 55 && r.slope_rating <= 155) &&
      teeSet.hole_yardages.length === wizardData.nines.length * 9 &&
      teeSet.hole_yardages.every(y => y.yardage >= 50 && y.yardage <= 700)
    );
  }, [wizardData.nines.length]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return wizardData.name.trim() !== '' &&
               wizardData.city.trim() !== '' &&
               wizardData.state !== '';
      case 2:
        return wizardData.nines.length > 0 &&
               wizardData.nines.every(n => n.name.trim() !== '' && n.holes.length === 9) &&
               wizardData.tee_sets.length > 0 &&
               wizardData.tee_sets.every(isTeeSetValid);
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardData, isTeeSetValid]);

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // Update nine name
  const updateNineName = (index: number, name: string) => {
    const newNines = [...wizardData.nines];
    const oldName = newNines[index].name;
    newNines[index] = { ...newNines[index], name };

    // Also update tee set references
    const newTeeSets = wizardData.tee_sets.map(ts => ({
      ...ts,
      nine_ratings: ts.nine_ratings.map(r =>
        r.nine_name === oldName ? { ...r, nine_name: name } : r
      ),
      hole_yardages: ts.hole_yardages.map(y =>
        y.nine_name === oldName ? { ...y, nine_name: name } : y
      ),
    }));

    setWizardData({ ...wizardData, nines: newNines, tee_sets: newTeeSets });
  };

  // Update hole data
  const updateHole = (nineIndex: number, holeIndex: number, field: 'par' | 'handicap_index', value: number) => {
    const newNines = [...wizardData.nines];
    newNines[nineIndex] = {
      ...newNines[nineIndex],
      holes: newNines[nineIndex].holes.map((h, i) =>
        i === holeIndex ? { ...h, [field]: value } : h
      ),
    };
    setWizardData({ ...wizardData, nines: newNines });
  };

  // Add tee set
  const addTeeSet = () => {
    const newTeeSet: TeeSetData = {
      name: '',
      color: '',
      nine_ratings: wizardData.nines.map(n => ({
        nine_name: n.name,
        course_rating: 36,
        slope_rating: 113,
      })),
      hole_yardages: wizardData.nines.flatMap(n =>
        n.holes.map(h => ({
          nine_name: n.name,
          hole_number: h.hole_number,
          yardage: 350,
        }))
      ),
    };
    setWizardData({ ...wizardData, tee_sets: [...wizardData.tee_sets, newTeeSet] });
  };

  // Remove tee set
  const removeTeeSet = (index: number) => {
    setWizardData({
      ...wizardData,
      tee_sets: wizardData.tee_sets.filter((_, i) => i !== index),
    });
  };

  // Update tee set field
  const updateTeeSet = (index: number, field: keyof TeeSetData, value: string) => {
    const newTeeSets = [...wizardData.tee_sets];
    newTeeSets[index] = { ...newTeeSets[index], [field]: value };
    setWizardData({ ...wizardData, tee_sets: newTeeSets });
  };

  // Update nine rating
  const updateNineRating = (teeIndex: number, nineName: string, field: 'course_rating' | 'slope_rating', value: number) => {
    const newTeeSets = [...wizardData.tee_sets];
    newTeeSets[teeIndex] = {
      ...newTeeSets[teeIndex],
      nine_ratings: newTeeSets[teeIndex].nine_ratings.map(r =>
        r.nine_name === nineName ? { ...r, [field]: value } : r
      ),
    };
    setWizardData({ ...wizardData, tee_sets: newTeeSets });
  };

  // Update hole yardage
  const updateHoleYardage = (teeIndex: number, nineName: string, holeNumber: number, yardage: number) => {
    const newTeeSets = [...wizardData.tee_sets];
    newTeeSets[teeIndex] = {
      ...newTeeSets[teeIndex],
      hole_yardages: newTeeSets[teeIndex].hole_yardages.map(y =>
        y.nine_name === nineName && y.hole_number === holeNumber ? { ...y, yardage } : y
      ),
    };
    setWizardData({ ...wizardData, tee_sets: newTeeSets });
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardData.name,
          city: wizardData.city,
          state: wizardData.state,
          zip_code: wizardData.zip_code || undefined,
          address: wizardData.address || undefined,
          course_type: wizardData.course_type || undefined,
          nines: wizardData.nines,
          tee_sets: wizardData.tee_sets,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }

      router.push(`/courses/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-semibold text-charcoal">Course Information</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">
            Course Name *
          </label>
          <input
            type="text"
            value={wizardData.name}
            onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
            className="input"
            placeholder="Enter course name"
          />
        </div>

        <div>
          <label className="label">City *</label>
          <input
            type="text"
            value={wizardData.city}
            onChange={(e) => setWizardData({ ...wizardData, city: e.target.value })}
            className="input"
            placeholder="City"
          />
        </div>

        <div>
          <label className="label">State *</label>
          <select
            value={wizardData.state}
            onChange={(e) => setWizardData({ ...wizardData, state: e.target.value })}
            className="input"
          >
            <option value="">Select state</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">ZIP Code</label>
          <input
            type="text"
            value={wizardData.zip_code}
            onChange={(e) => setWizardData({ ...wizardData, zip_code: e.target.value })}
            className="input"
            placeholder="ZIP code"
          />
        </div>

        <div>
          <label className="label">Course Type</label>
          <select
            value={wizardData.course_type}
            onChange={(e) => setWizardData({ ...wizardData, course_type: e.target.value as WizardData['course_type'] })}
            className="input"
          >
            <option value="">Select type</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="resort">Resort</option>
            <option value="municipal">Municipal</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Number of Nines</label>
          <p className="mt-1 text-sm text-muted">
            {wizardData.num_nines === 1 ? '9 holes' : wizardData.num_nines === 2 ? '18 holes' : '27 holes'}
            <span className="text-status-warning-text ml-2">(Cannot be changed after creation)</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Render Step 2: Scorecard-style editing
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold text-charcoal">Scorecard</h2>
          <p className="text-sm text-muted">
            Configure holes, pars, handicaps, and tee sets
          </p>
        </div>
      </div>

      {/* Render each nine as a scorecard section */}
      {wizardData.nines.map((nine, nineIndex) => (
        <div key={nineIndex} className="overflow-hidden rounded-lg border border-card-border">
          {/* Nine header with name input */}
          <div className="bg-cream-300 px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-medium text-muted">Nine Name:</span>
            <input
              type="text"
              value={nine.name}
              onChange={(e) => updateNineName(nineIndex, e.target.value)}
              className="rounded border border-card-border px-2 py-1 text-sm font-semibold w-32 focus:border-secondary focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* Scorecard table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Hole numbers row */}
                <tr className="bg-cream-200">
                  <th className="px-2 py-2 text-left font-semibold text-muted w-32 border-r border-card-border">
                    Hole
                  </th>
                  {nine.holes.map((hole) => (
                    <th key={hole.hole_number} className="px-1 py-2 text-center font-semibold text-muted w-14 border-r border-cream-300">
                      {hole.hole_number}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold text-muted w-16 bg-cream-300">
                    Out
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Par row */}
                <tr className="border-t border-card-border">
                  <td className="px-2 py-2 font-medium text-muted bg-cream-200 border-r border-card-border">
                    Par
                  </td>
                  {nine.holes.map((hole, holeIndex) => (
                    <td key={hole.hole_number} className="px-1 py-1 border-r border-cream-300">
                      <select
                        value={hole.par}
                        onChange={(e) => updateHole(nineIndex, holeIndex, 'par', parseInt(e.target.value))}
                        className="w-full rounded border border-card-border px-1 py-1 text-center text-sm bg-white focus:border-secondary focus:ring-1 focus:ring-secondary"
                      >
                        {[3, 4, 5, 6].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-bold text-charcoal bg-cream-300">
                    {nine.holes.reduce((sum, h) => sum + h.par, 0)}
                  </td>
                </tr>

                {/* Handicap row */}
                <tr className="border-t border-card-border">
                  <td className="px-2 py-2 font-medium text-muted bg-cream-200 border-r border-card-border">
                    Handicap
                  </td>
                  {nine.holes.map((hole, holeIndex) => {
                    const maxHandicap = wizardData.num_nines === 2 ? 18 : 9;
                    return (
                      <td key={hole.hole_number} className="px-1 py-1 border-r border-cream-300">
                        <select
                          value={hole.handicap_index > maxHandicap ? maxHandicap : hole.handicap_index}
                          onChange={(e) => updateHole(nineIndex, holeIndex, 'handicap_index', parseInt(e.target.value))}
                          className="w-full rounded border border-card-border px-1 py-1 text-center text-sm bg-white focus:border-secondary focus:ring-1 focus:ring-secondary"
                        >
                          {Array.from({ length: maxHandicap }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td className="bg-cream-300"></td>
                </tr>

                {/* Tee set rows */}
                {wizardData.tee_sets.map((teeSet, teeIndex) => {
                  const colorStyles = getTeeColorStyles(teeSet.color);
                  const nineRating = teeSet.nine_ratings.find(r => r.nine_name === nine.name);
                  const nineYardages = teeSet.hole_yardages.filter(y => y.nine_name === nine.name);
                  const totalYardage = nineYardages.reduce((sum, y) => sum + y.yardage, 0);

                  return (
                    <tr key={teeIndex} className="border-t-2 border-card-border">
                      {/* Tee info cell */}
                      <td className={`px-2 py-2 border-r border-card-border ${colorStyles.bg} ${colorStyles.text}`}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeTeeSet(teeIndex)}
                            className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
                            title="Remove tee set"
                          >
                            &times;
                          </button>
                          <div className="flex flex-col gap-1 flex-1">
                            <input
                              type="text"
                              value={teeSet.name}
                              onChange={(e) => updateTeeSet(teeIndex, 'name', e.target.value)}
                              placeholder="Name"
                              className="w-full rounded border border-card-border px-1 py-0.5 text-xs text-charcoal bg-white"
                            />
                            <select
                              value={teeSet.color}
                              onChange={(e) => updateTeeSet(teeIndex, 'color', e.target.value)}
                              className="w-full rounded border border-card-border px-1 py-0.5 text-xs text-charcoal bg-white"
                            >
                              <option value="">Color</option>
                              {TEE_COLORS.map((c) => (
                                <option key={c.value} value={c.value}>{c.name}</option>
                              ))}
                            </select>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="0.1"
                                min="25"
                                max="45"
                                value={nineRating?.course_rating || 36}
                                onChange={(e) => updateNineRating(teeIndex, nine.name, 'course_rating', parseFloat(e.target.value))}
                                className="w-14 rounded border border-card-border px-1 py-0.5 text-xs text-charcoal bg-white"
                                title="Course Rating (9-hole)"
                              />
                              <span className="text-xs opacity-75">/</span>
                              <input
                                type="number"
                                min="55"
                                max="155"
                                value={nineRating?.slope_rating || 113}
                                onChange={(e) => updateNineRating(teeIndex, nine.name, 'slope_rating', parseInt(e.target.value))}
                                className="w-12 rounded border border-card-border px-1 py-0.5 text-xs text-charcoal bg-white"
                                title="Slope Rating"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Yardage cells */}
                      {nine.holes.map((hole) => {
                        const yardage = nineYardages.find(y => y.hole_number === hole.hole_number);
                        return (
                          <td key={hole.hole_number} className="px-0.5 py-1 border-r border-cream-300">
                            <input
                              type="number"
                              min="50"
                              max="700"
                              value={yardage?.yardage || 350}
                              onChange={(e) => updateHoleYardage(teeIndex, nine.name, hole.hole_number, parseInt(e.target.value))}
                              className="w-full rounded border border-card-border px-0.5 py-1 text-center text-xs focus:border-secondary focus:ring-1 focus:ring-secondary"
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-bold text-charcoal bg-cream-300">
                        {totalYardage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Add Tee Set button */}
      <button
        onClick={addTeeSet}
        className="flex items-center gap-2 rounded-md border-2 border-dashed border-card-border px-4 py-3 text-sm font-medium text-muted hover:border-secondary hover:text-secondary transition-colors w-full justify-center"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Tee Set
      </button>

      {/* Validation message */}
      {wizardData.tee_sets.length === 0 && (
        <p className="text-sm text-status-warning-text text-center">
          Add at least one tee set to continue
        </p>
      )}

      {wizardData.tee_sets.length > 0 && !wizardData.tee_sets.every(isTeeSetValid) && (
        <p className="text-sm text-status-warning-text text-center">
          Please fill in all tee set details (name, color, ratings, and yardages)
        </p>
      )}
    </div>
  );

  // Render Step 3: Review
  const renderStep3 = () => {
    const totalPar = wizardData.nines.reduce(
      (sum, n) => sum + n.holes.reduce((s, h) => s + h.par, 0),
      0
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-serif font-semibold text-charcoal">Review & Save</h2>

        <div className="rounded-lg bg-cream-200 p-4">
          <h3 className="mb-2 font-medium text-charcoal">{wizardData.name}</h3>
          <p className="text-sm text-muted">
            {wizardData.city}, {wizardData.state} {wizardData.zip_code}
          </p>
          <p className="text-sm text-muted">
            {wizardData.num_nines * 9} holes ({wizardData.num_nines === 1 ? '9-hole course' :
              wizardData.num_nines === 2 ? '18-hole course' : '27-hole course'})
            {wizardData.course_type && ` | ${wizardData.course_type}`}
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-medium text-charcoal">Nines</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {wizardData.nines.map((nine) => (
              <div key={nine.name} className="rounded border border-card-border p-3 bg-card">
                <div className="font-medium text-charcoal">{nine.name}</div>
                <div className="text-sm text-muted">
                  Par {nine.holes.reduce((sum, h) => sum + h.par, 0)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-medium text-muted">
            Total Par: {totalPar}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-medium text-charcoal">Tee Sets ({wizardData.tee_sets.length})</h3>
          <div className="space-y-2">
            {wizardData.tee_sets.map((tee) => {
              const totalYardage = tee.hole_yardages.reduce((sum, y) => sum + y.yardage, 0);
              const totalRating = tee.nine_ratings.reduce((sum, r) => sum + r.course_rating, 0);
              const avgSlope = Math.round(
                tee.nine_ratings.reduce((sum, r) => sum + r.slope_rating, 0) / tee.nine_ratings.length
              );
              const colorStyles = getTeeColorStyles(tee.color);

              return (
                <div key={tee.name} className="flex items-center justify-between rounded border border-card-border p-3 bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full ${colorStyles.bg}`} />
                    <div className="font-medium text-charcoal">{tee.name}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-charcoal">{totalYardage.toLocaleString()} yards</div>
                    <div className="text-muted">
                      {totalRating.toFixed(1)} / {avgSlope}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-status-error p-4">
            <p className="text-sm text-status-error-text">{error}</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cream-300 rounded w-1/3"></div>
          <div className="card p-6">
            <div className="h-6 bg-cream-300 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-cream-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-cream-300 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center text-muted hover:text-secondary"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Course
        </Link>
        <div className="bg-status-error border border-status-error-text/30 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-status-error-text mb-2">{loadError}</h2>
          <p className="text-status-error-text/80">Please try again or go back to the course page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Back Link */}
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center text-muted hover:text-secondary mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cancel Edit
      </Link>

      {/* Progress Steps */}
      <nav className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep > step.id
                      ? 'bg-secondary text-charcoal'
                      : currentStep === step.id
                      ? 'bg-primary text-white'
                      : 'bg-cream-300 text-muted'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className={`ml-2 text-sm ${currentStep >= step.id ? 'text-charcoal' : 'text-muted'}`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`mx-4 h-0.5 flex-1 ${currentStep > step.id ? 'bg-secondary' : 'bg-cream-300'}`} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="card p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
