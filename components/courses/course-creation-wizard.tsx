'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  { name: 'Black', value: 'black', bg: 'bg-gray-900', text: 'text-white' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600', text: 'text-white' },
  { name: 'White', value: 'white', bg: 'bg-white border border-gray-300', text: 'text-gray-900' },
  { name: 'Gold', value: 'gold', bg: 'bg-amber-400', text: 'text-gray-900' },
  { name: 'Red', value: 'red', bg: 'bg-red-600', text: 'text-white' },
  { name: 'Green', value: 'green', bg: 'bg-green-600', text: 'text-white' },
];

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Course details' },
  { id: 2, name: 'Scorecard', description: 'Holes & tees' },
  { id: 3, name: 'Review', description: 'Confirm & create' },
];

// Default hole data
const createDefaultHoles = (): HoleData[] =>
  Array.from({ length: 9 }, (_, i) => ({
    hole_number: i + 1,
    par: 4,
    handicap_index: i + 1,
  }));

const createDefaultNine = (name: string, type: 'front' | 'back' | 'named', order: number): NineData => ({
  name,
  nine_type: type,
  display_order: order,
  holes: createDefaultHoles(),
});

const getTeeColorStyles = (colorValue: string) => {
  const color = TEE_COLORS.find(c => c.value === colorValue);
  return color || { bg: 'bg-gray-200', text: 'text-gray-900' };
};

export default function CourseCreationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    city: '',
    state: '',
    zip_code: '',
    address: '',
    course_type: '',
    num_nines: 2,
    nines: [
      createDefaultNine('Front', 'front', 0),
      createDefaultNine('Back', 'back', 1),
    ],
    tee_sets: [],
  });

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

  // Update number of nines
  const updateNumNines = (num: number) => {
    let newNines: NineData[];

    if (num === 1) {
      newNines = [createDefaultNine('Main', 'named', 0)];
    } else if (num === 2) {
      newNines = [
        createDefaultNine('Front', 'front', 0),
        createDefaultNine('Back', 'back', 1),
      ];
    } else {
      newNines = [
        createDefaultNine('First', 'named', 0),
        createDefaultNine('Second', 'named', 1),
        createDefaultNine('Third', 'named', 2),
      ];
    }

    setWizardData({ ...wizardData, num_nines: num, nines: newNines, tee_sets: [] });
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
      const response = await fetch('/api/courses', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create course');
      }

      const course = await response.json();
      router.push(`/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Course Information</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Course Name *
          </label>
          <input
            type="text"
            value={wizardData.name}
            onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Enter course name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">City *</label>
          <input
            type="text"
            value={wizardData.city}
            onChange={(e) => setWizardData({ ...wizardData, city: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="City"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">State *</label>
          <select
            value={wizardData.state}
            onChange={(e) => setWizardData({ ...wizardData, state: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select state</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
          <input
            type="text"
            value={wizardData.zip_code}
            onChange={(e) => setWizardData({ ...wizardData, zip_code: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="ZIP code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Course Type</label>
          <select
            value={wizardData.course_type}
            onChange={(e) => setWizardData({ ...wizardData, course_type: e.target.value as WizardData['course_type'] })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select type</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="resort">Resort</option>
            <option value="municipal">Municipal</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Number of Nines</label>
          <div className="mt-2 flex gap-4">
            {[1, 2, 3].map((num) => (
              <label key={num} className="flex items-center">
                <input
                  type="radio"
                  checked={wizardData.num_nines === num}
                  onChange={() => updateNumNines(num)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {num === 1 ? '9 holes' : num === 2 ? '18 holes' : '27 holes'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 2: Scorecard-style editing
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Scorecard</h2>
          <p className="text-sm text-gray-600">
            Configure holes, pars, handicaps, and tee sets
          </p>
        </div>
      </div>

      {/* Render each nine as a scorecard section */}
      {wizardData.nines.map((nine, nineIndex) => (
        <div key={nineIndex} className="overflow-hidden rounded-lg border border-gray-200">
          {/* Nine header with name input */}
          <div className="bg-gray-100 px-4 py-2 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Nine Name:</span>
            <input
              type="text"
              value={nine.name}
              onChange={(e) => updateNineName(nineIndex, e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold w-32"
            />
          </div>

          {/* Scorecard table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Hole numbers row */}
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left font-semibold text-gray-700 w-32 border-r border-gray-200">
                    Hole
                  </th>
                  {nine.holes.map((hole) => (
                    <th key={hole.hole_number} className="px-1 py-2 text-center font-semibold text-gray-700 w-14 border-r border-gray-100">
                      {hole.hole_number}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold text-gray-700 w-16 bg-gray-100">
                    Out
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Par row */}
                <tr className="border-t border-gray-200">
                  <td className="px-2 py-2 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    Par
                  </td>
                  {nine.holes.map((hole, holeIndex) => (
                    <td key={hole.hole_number} className="px-1 py-1 border-r border-gray-100">
                      <select
                        value={hole.par}
                        onChange={(e) => updateHole(nineIndex, holeIndex, 'par', parseInt(e.target.value))}
                        className="w-full rounded border border-gray-300 px-1 py-1 text-center text-sm bg-white"
                      >
                        {[3, 4, 5, 6].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-bold text-gray-900 bg-gray-100">
                    {nine.holes.reduce((sum, h) => sum + h.par, 0)}
                  </td>
                </tr>

                {/* Handicap row */}
                <tr className="border-t border-gray-200">
                  <td className="px-2 py-2 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    Handicap
                  </td>
                  {nine.holes.map((hole, holeIndex) => {
                    // For 9-hole courses: use 1-9
                    // For 18-hole courses: use 1-18
                    // For 27-hole courses: use 1-9 per nine (nines are interchangeable)
                    const maxHandicap = wizardData.num_nines === 2 ? 18 : 9;
                    return (
                      <td key={hole.hole_number} className="px-1 py-1 border-r border-gray-100">
                        <select
                          value={hole.handicap_index > maxHandicap ? maxHandicap : hole.handicap_index}
                          onChange={(e) => updateHole(nineIndex, holeIndex, 'handicap_index', parseInt(e.target.value))}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-center text-sm bg-white"
                        >
                          {Array.from({ length: maxHandicap }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td className="bg-gray-100"></td>
                </tr>

                {/* Tee set rows */}
                {wizardData.tee_sets.map((teeSet, teeIndex) => {
                  const colorStyles = getTeeColorStyles(teeSet.color);
                  const nineRating = teeSet.nine_ratings.find(r => r.nine_name === nine.name);
                  const nineYardages = teeSet.hole_yardages.filter(y => y.nine_name === nine.name);
                  const totalYardage = nineYardages.reduce((sum, y) => sum + y.yardage, 0);

                  return (
                    <tr key={teeIndex} className="border-t-2 border-gray-300">
                      {/* Tee info cell */}
                      <td className={`px-2 py-2 border-r border-gray-200 ${colorStyles.bg} ${colorStyles.text}`}>
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
                              className="w-full rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-900 bg-white"
                            />
                            <select
                              value={teeSet.color}
                              onChange={(e) => updateTeeSet(teeIndex, 'color', e.target.value)}
                              className="w-full rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-900 bg-white"
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
                                className="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-900 bg-white"
                                title="Course Rating (9-hole)"
                              />
                              <span className="text-xs opacity-75">/</span>
                              <input
                                type="number"
                                min="55"
                                max="155"
                                value={nineRating?.slope_rating || 113}
                                onChange={(e) => updateNineRating(teeIndex, nine.name, 'slope_rating', parseInt(e.target.value))}
                                className="w-12 rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-900 bg-white"
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
                          <td key={hole.hole_number} className="px-0.5 py-1 border-r border-gray-100">
                            <input
                              type="number"
                              min="50"
                              max="700"
                              value={yardage?.yardage || 350}
                              onChange={(e) => updateHoleYardage(teeIndex, nine.name, hole.hole_number, parseInt(e.target.value))}
                              className="w-full rounded border border-gray-300 px-0.5 py-1 text-center text-xs"
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center font-bold text-gray-900 bg-gray-100">
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
        className="flex items-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors w-full justify-center"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Tee Set
      </button>

      {/* Validation message */}
      {wizardData.tee_sets.length === 0 && (
        <p className="text-sm text-amber-600 text-center">
          Add at least one tee set to continue
        </p>
      )}

      {wizardData.tee_sets.length > 0 && !wizardData.tee_sets.every(isTeeSetValid) && (
        <p className="text-sm text-amber-600 text-center">
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
        <h2 className="text-xl font-semibold text-gray-900">Review & Create</h2>

        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 font-medium text-gray-900">{wizardData.name}</h3>
          <p className="text-sm text-gray-600">
            {wizardData.city}, {wizardData.state} {wizardData.zip_code}
          </p>
          <p className="text-sm text-gray-600">
            {wizardData.num_nines * 9} holes ({wizardData.num_nines === 1 ? '9-hole course' :
              wizardData.num_nines === 2 ? '18-hole course' : '27-hole course'})
            {wizardData.course_type && ` | ${wizardData.course_type}`}
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-medium text-gray-900">Nines</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {wizardData.nines.map((nine) => (
              <div key={nine.name} className="rounded border border-gray-200 p-3">
                <div className="font-medium">{nine.name}</div>
                <div className="text-sm text-gray-600">
                  Par {nine.holes.reduce((sum, h) => sum + h.par, 0)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-medium text-gray-700">
            Total Par: {totalPar}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-medium text-gray-900">Tee Sets ({wizardData.tee_sets.length})</h3>
          <div className="space-y-2">
            {wizardData.tee_sets.map((tee) => {
              const totalYardage = tee.hole_yardages.reduce((sum, y) => sum + y.yardage, 0);
              const totalRating = tee.nine_ratings.reduce((sum, r) => sum + r.course_rating, 0);
              const avgSlope = Math.round(
                tee.nine_ratings.reduce((sum, r) => sum + r.slope_rating, 0) / tee.nine_ratings.length
              );
              const colorStyles = getTeeColorStyles(tee.color);

              return (
                <div key={tee.name} className="flex items-center justify-between rounded border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full ${colorStyles.bg}`} />
                    <div className="font-medium">{tee.name}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{totalYardage.toLocaleString()} yards</div>
                    <div className="text-gray-600">
                      {totalRating.toFixed(1)} / {avgSlope}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Progress Steps */}
      <nav className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className={`ml-2 text-sm ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`mx-4 h-0.5 flex-1 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed()}
            className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        )}
      </div>
    </div>
  );
}
