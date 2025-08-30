"use client";
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { Controller, Control } from 'react-hook-form';
import { Label } from './label';

// Corregido: Se definen las props que el componente espera
interface CountrySelectorProps {
  name: string;
  control: Control<any>;
  required?: boolean;
}

export const CountrySelector = ({ name, control, required = false }: CountrySelectorProps) => {
  return (
    <div>
      <Controller
        name={name}
        control={control}
        rules={{ required: required }}
        render={({ field }) => (
          <PhoneInput
            {...field}
            international
            defaultCountry="CL"
            className="input"
            placeholder="Ingrese número de teléfono"
          />
        )}
      />
    </div>
  );
};