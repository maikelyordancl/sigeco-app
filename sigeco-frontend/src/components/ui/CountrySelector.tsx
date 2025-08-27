"use client";

import React, { useMemo } from 'react';
import Select from 'react-select';
import countryList from 'react-select-country-list';

interface CountrySelectorProps {
  value?: { label: string; value: string };
  onChange: (value: { label: string; value: string } | null) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange }) => {
  const options = useMemo(() => countryList().getData(), []);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '36px',
      height: '36px',
      boxShadow: 'none',
      borderColor: 'hsl(var(--input))',
      '&:hover': {
        borderColor: 'hsl(var(--ring))',
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: '36px',
      padding: '0 6px'
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '36px',
    }),
  };

  return <Select options={options} value={value} onChange={onChange} styles={customStyles} placeholder="Selecciona un país..." />;
};