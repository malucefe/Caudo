import { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL devuelve las columnas `numeric` como string. Este transformer
 * las convierte a number al leerlas y deja pasar el valor al escribirlas.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? null : parseFloat(value),
};
