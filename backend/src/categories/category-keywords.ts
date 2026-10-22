import { CategoryType } from './entities/category.entity';

/**
 * Diccionario de palabras clave (contexto colombiano) para sugerir la categoría
 * de una transacción a partir de su descripción. Las claves son los nombres de
 * las categorías sembradas en `SeedService`.
 */
export const CATEGORY_KEYWORDS: Record<CategoryType, Record<string, string[]>> = {
  [CategoryType.EGRESO]: {
    Transporte: [
      'uber', 'taxi', 'bus', 'transmilenio', 'sitp', 'metro', 'gasolina',
      'peaje', 'parqueadero', 'cabify', 'didi', 'indriver', 'pasaje', 'tiquete',
    ],
    Alimentación: [
      'restaurante', 'almuerzo', 'desayuno', 'cena', 'mercado', 'supermercado',
      'exito', 'jumbo', 'olimpica', 'rappi', 'domicilio', 'comida', 'cafe',
      'panaderia', 'pizza', 'hamburguesa', 'corrientazo', 'tienda',
    ],
    Arriendo: ['arriendo', 'alquiler', 'administracion', 'hipoteca'],
    'Servicios Públicos': [
      'luz', 'agua', 'gas', 'energia', 'internet', 'plan de datos', 'claro',
      'movistar', 'tigo', 'acueducto', 'epm', 'codensa', 'enel', 'vanti',
    ],
    Entretenimiento: [
      'cine', 'concierto', 'fiesta', 'bar', 'discoteca', 'videojuego',
      'parque', 'evento', 'salida', 'teatro',
    ],
    Salud: [
      'medico', 'drogueria', 'farmacia', 'medicina', 'eps', 'odontologo',
      'dentista', 'clinica', 'hospital', 'examen', 'terapia',
    ],
    Educación: [
      'universidad', 'matricula', 'curso', 'libro', 'colegio', 'semestre',
      'utiles', 'papeleria', 'diplomado',
    ],
    Ropa: ['ropa', 'zapatos', 'camisa', 'pantalon', 'jean', 'tenis', 'vestido', 'chaqueta'],
    Tecnología: ['computador', 'laptop', 'tablet', 'software', 'audifonos', 'cargador', 'teclado', 'monitor'],
    Ahorro: ['ahorro', 'cdt', 'alcancia', 'fondo de emergencia'],
    Mascota: ['mascota', 'veterinario', 'perro', 'gato', 'purina', 'concentrado'],
    'Cuidado Personal': ['peluqueria', 'barberia', 'spa', 'unas', 'maquillaje', 'gimnasio', 'gym', 'perfume'],
    Suscripciones: ['netflix', 'spotify', 'disney', 'hbo', 'prime', 'youtube premium', 'suscripcion', 'apple music'],
    'Otros Gastos': [],
  },
  [CategoryType.INGRESO]: {
    Salario: ['salario', 'nomina', 'sueldo', 'quincena'],
    Freelance: ['freelance', 'honorarios', 'proyecto', 'cliente'],
    Inversiones: ['dividendos', 'intereses', 'rendimientos', 'inversion'],
    Ventas: ['venta', 'vendi', 'vendido'],
    Bonificaciones: ['bono', 'bonificacion', 'prima', 'aguinaldo', 'incentivo'],
    'Otros Ingresos': [],
  },
};

/** Categoría por defecto cuando ninguna palabra clave coincide. */
export const DEFAULT_CATEGORY_NAME: Record<CategoryType, string> = {
  [CategoryType.EGRESO]: 'Otros Gastos',
  [CategoryType.INGRESO]: 'Otros Ingresos',
};
