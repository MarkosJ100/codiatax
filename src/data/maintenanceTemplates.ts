import { MaintenanceItem } from '../types';

export interface MaintenanceTemplate {
    id: string;
    brand: string;
    model: string;
    yearLabel: string;
    fuelType: string;
    displayName: string;
    baseIntervalLabel: string;
    reliability: 'oficial' | 'manual_aportado' | 'orientativo';
    sourceNote: string;
    maintenanceTips: string[];
    frequentChecks: string[];
    longTermChecks: string[];
    taxiFocus: string[];
    items: Record<string, Omit<MaintenanceItem, 'lastKm'>>;
}

export const maintenanceTemplates: MaintenanceTemplate[] = [
    {
        id: 'toyota-auris-hybrid',
        brand: 'Toyota',
        model: 'Auris Hybrid',
        yearLabel: '2013+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Toyota Auris Hybrid',
        baseIntervalLabel: 'Cada 15.000 km o 12 meses',
        reliability: 'orientativo',
        sourceNote: 'Base orientativa para Europa basada en manuales Toyota y patron habitual de servicio; puede variar segun ano, pais y libro de mantenimiento.',
        maintenanceTips: [
            'Mantenimiento habitual cada 15.000 km o 12 meses.',
            'Aceite y filtro en cada servicio, con revision general del sistema hibrido.',
            'Rotacion de neumaticos y control de frenos muy recomendables en uso urbano.',
            'Filtro de aire, habitaculo y refrigerante con intervalos mas largos.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Revision visual de frenos'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Refrigerante del sistema hibrido/motor a kilometraje alto',
            'Control de bateria auxiliar y alineacion'
        ],
        taxiFocus: [
            'Vigilar desgaste irregular de neumaticos',
            'Controlar discos y pastillas por uso urbano',
            'Revisar estado del climatizador por uso continuo'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            brakes: { name: 'Revision de frenos', interval: 30000 },
            coolant: { name: 'Refrigerante hibrido/motor', interval: 150000 }
        }
    },
    {
        id: 'toyota-c-hr-hybrid',
        brand: 'Toyota',
        model: 'C-HR Hybrid',
        yearLabel: '2017+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Toyota C-HR Hybrid',
        baseIntervalLabel: 'Cada 15.000-16.000 km o 12 meses',
        reliability: 'orientativo',
        sourceNote: 'Base orientativa; en Toyota conviene contrastar siempre con el service booklet del ano exacto y mercado.',
        maintenanceTips: [
            'Revision cada 15.000-16.000 km o 12 meses.',
            'Servicio basico con aceite, filtro e inspeccion general.',
            'Neumaticos, frenos y suspension conviene vigilarlos de cerca en ciudad.',
            'Filtro habitaculo y filtro de aire siguen un patron periodico.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Chequeo de suspension y frenos'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Refrigerante hibrido/motor a largo plazo',
            'Revision de bateria auxiliar'
        ],
        taxiFocus: [
            'Neumaticos y alineacion por uso intensivo',
            'Frenos y silentblocks en entorno urbano',
            'Control de consumo de aceite entre revisiones'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            brakes: { name: 'Revision de frenos', interval: 30000 },
            coolant: { name: 'Refrigerante hibrido/motor', interval: 150000 }
        }
    },
    {
        id: 'hyundai-ioniq-hybrid-2020',
        brand: 'Hyundai',
        model: 'Ioniq Hybrid',
        yearLabel: '2020',
        fuelType: 'Gasolina hibrida',
        displayName: 'Hyundai Ioniq Hybrid 2020',
        baseIntervalLabel: 'Cada 15.000 km o 12 meses',
        reliability: 'manual_aportado',
        sourceNote: 'Ajustado con la tabla de mantenimiento que me has pasado, coherente con el esquema Hyundai por kilometraje y anos.',
        maintenanceTips: [
            'Aceite motor y filtro en cada revision anual: 15.000 km o 12 meses.',
            'Liquido de frenos, filtro de polen y liquido del accionador del embrague cada 30.000 km.',
            'Filtro de aire cada 45.000 km y correa HSG cada 60.000 km segun la tabla que me has pasado.',
            'La tabla tambien marca muchas inspecciones periodicas de frenos, neumaticos, direccion y sistema HV.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Inspeccion de correa HSG',
            'Revision de frenos, neumaticos y direccion',
            'Comprobacion de bateria, limpiaparabrisas y aire acondicionado'
        ],
        longTermChecks: [
            'Liquido de frenos cada 30.000 km',
            'Filtro de polen cada 30.000 km',
            'Liquido del accionador del embrague cada 30.000 km',
            'Filtro de aire cada 45.000 km',
            'Correa HSG cada 60.000 km'
        ],
        taxiFocus: [
            'Vigilar frenos y pinzas por uso urbano intensivo',
            'Controlar presiones, desgaste y alineacion de neumaticos',
            'Revisar climatizacion, conductos y bateria auxiliar',
            'No descuidar las inspecciones del sistema HV y el autodiagnostico'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            brake_fluid: { name: 'Liquido de frenos', interval: 30000 },
            cabin_filter: { name: 'Filtro de polen', interval: 30000 },
            clutch_actuator_fluid: { name: 'Liquido accionador embrague', interval: 30000 },
            tires: { name: 'Revision de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            hsg_belt_check: { name: 'Inspeccion correa HSG', interval: 15000 },
            hsg_belt: { name: 'Correa HSG', interval: 60000 },
            brakes: { name: 'Revision de pastillas y discos', interval: 15000 }
        }
    },
    {
        id: 'hyundai-kona-hybrid',
        brand: 'Hyundai',
        model: 'Kona Hybrid',
        yearLabel: '2019+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Hyundai Kona Hybrid',
        baseIntervalLabel: 'Cada 13.000 km o 12 meses',
        reliability: 'oficial',
        sourceNote: 'Basado en el programa oficial Hyundai Owners Manual web para Kona HEV; puede variar ligeramente por generacion y mercado.',
        maintenanceTips: [
            'Programa oficial consultado: aceite y filtro cada 13.000 km o 12 meses.',
            'Neumaticos cada 13.000 km, filtro de habitaculo anual y filtro de aire sobre 39.000 km.',
            'Bujias sobre 78.000 km y refrigerante a muy largo plazo, aprox. 200.000 km o 10 anos.',
            'El manual tambien marca inspeccion continua de frenos, direccion, transmision y sistema electrico.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Chequeo de frenos, direccion y suspension'
        ],
        longTermChecks: [
            'Filtro de aire sobre 39.000 km',
            'Bujias sobre 78.000 km',
            'Liquido de frenos sobre 78.000 km o 48 meses',
            'Refrigerante sobre 200.000 km o 10 anos'
        ],
        taxiFocus: [
            'Desgaste de neumaticos por peso y uso urbano',
            'Pastillas/discos en recorridos frecuentes',
            'Comprobar silentblocks y amortiguacion'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 13000 },
            oil_filter: { name: 'Filtro de aceite', interval: 13000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 13000 },
            tires: { name: 'Rotacion de neumaticos', interval: 13000 },
            air_filter: { name: 'Filtro de aire', interval: 39000 },
            spark_plugs: { name: 'Bujias', interval: 78000 },
            brake_fluid: { name: 'Liquido de frenos', interval: 78000 },
            brakes: { name: 'Revision de pastillas y discos', interval: 13000 },
            coolant: { name: 'Refrigerante', interval: 200000 }
        }
    },
    {
        id: 'toyota-prius-plus-hybrid',
        brand: 'Toyota',
        model: 'Prius Plus',
        yearLabel: '2012+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Toyota Prius Plus Hybrid',
        baseIntervalLabel: 'Cada 15.000-16.000 km o 12 meses',
        reliability: 'orientativo',
        sourceNote: 'Base orientativa de uso europeo; Toyota suele remitir al Service Booklet del vehiculo para el detalle exacto.',
        maintenanceTips: [
            'Toyota suele trabajar con revision anual o cada 15.000-16.000 km.',
            'Aceite y filtro en cada servicio.',
            'Rotacion de neumaticos y revision de frenos en cada mantenimiento.',
            'Bujias y refrigerante del sistema hibrido a intervalos largos.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Revision de frenos'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Bujias sobre 90.000 km',
            'Refrigerante hibrido/motor a kilometraje alto'
        ],
        taxiFocus: [
            'Controlar frenos y discos por ciudad',
            'Vigilar carga del coche y desgaste de suspension',
            'Revisar climatizacion por uso continuado'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            spark_plugs: { name: 'Bujias', interval: 90000 },
            coolant: { name: 'Refrigerante hibrido/motor', interval: 150000 },
            brakes: { name: 'Revision de frenos', interval: 30000 }
        }
    },
    {
        id: 'toyota-corolla-hybrid',
        brand: 'Toyota',
        model: 'Corolla Hybrid',
        yearLabel: '2019+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Toyota Corolla Hybrid',
        baseIntervalLabel: 'Cada 15.000 km o 12 meses',
        reliability: 'orientativo',
        sourceNote: 'Base orientativa para Europa; algunos manuales muestran tablas por mercado y conviene verificar el service booklet del ano exacto.',
        maintenanceTips: [
            'Mantenimiento habitual cada 15.000 km o 12 meses.',
            'Servicio menor con aceite, filtro e inspeccion general.',
            'Filtro de habitaculo y rotacion de neumaticos de forma periodica.',
            'Muy recomendable vigilar frenos y estado de la bateria auxiliar.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Revision visual de frenos'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Refrigerante hibrido/motor a largo plazo',
            'Bateria auxiliar y alineacion'
        ],
        taxiFocus: [
            'Pastillas y discos por uso urbano',
            'Neumaticos delanteros y alineacion',
            'Chequeo del sistema A/C por jornadas largas'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            brakes: { name: 'Revision de frenos', interval: 30000 },
            coolant: { name: 'Refrigerante hibrido/motor', interval: 150000 }
        }
    },
    {
        id: 'toyota-rav4-hybrid',
        brand: 'Toyota',
        model: 'RAV4 Hybrid',
        yearLabel: '2019+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Toyota RAV4 Hybrid',
        baseIntervalLabel: 'Cada 15.000-16.000 km o 12 meses',
        reliability: 'orientativo',
        sourceNote: 'Base orientativa; en RAV4 Hybrid Toyota separa mucho por mercado y el libro de mantenimiento manda sobre la media general.',
        maintenanceTips: [
            'Revision anual o cada 15.000-16.000 km, segun mercado.',
            'Aceite, filtro y chequeo general en cada servicio.',
            'En versiones AWD conviene vigilar neumaticos y tren rodante con mas mimo.',
            'Frenos, suspension y filtros cobran mas importancia por peso y uso intensivo.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Frenos, suspension y tren rodante'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Refrigerante a largo plazo',
            'Control de transmision/ejes en AWD'
        ],
        taxiFocus: [
            'Desgaste mas rapido por peso del vehiculo',
            'Vigilar silentblocks, amortiguacion y direccion',
            'Revisar frenos con mas frecuencia'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            brakes: { name: 'Revision de frenos', interval: 30000 },
            coolant: { name: 'Refrigerante hibrido/motor', interval: 150000 }
        }
    },
    {
        id: 'kia-niro-hybrid',
        brand: 'Kia',
        model: 'Niro Hybrid',
        yearLabel: '2016+',
        fuelType: 'Gasolina hibrida',
        displayName: 'Kia Niro Hybrid',
        baseIntervalLabel: 'Cada 15.000 km o 12 meses',
        reliability: 'oficial',
        sourceNote: 'Basado en el manual Kia Niro Hybrid para Europa consultado en la web; el uso severo acorta aceite/filtro a 7.500 km o 6 meses.',
        maintenanceTips: [
            'Programa europeo consultado: revision base cada 15.000 km o 12 meses.',
            'En uso severo, aceite y filtro bajan a 7.500 km o 6 meses.',
            'Refrigerante motor/inversor: primer cambio a 210.000 km o 120 meses, despues cada 30.000 km o 24 meses.',
            'Filtro del climatizador se cambia antes si haces mucha ciudad, polvo o trafico intenso.'
        ],
        frequentChecks: [
            'Aceite motor y filtro',
            'Filtro habitaculo',
            'Rotacion de neumaticos',
            'Chequeo general de frenos'
        ],
        longTermChecks: [
            'Filtro de aire sobre 45.000 km',
            'Refrigerante a 210.000 km o 120 meses',
            'Sistema electrificado e HSG segun inspeccion',
            'DCT segun mantenimiento y uso'
        ],
        taxiFocus: [
            'Controlar frenos por trayectos de ciudad',
            'Vigilar desgaste de ruedas y equilibrado',
            'Revisar estado del climatizador y bateria auxiliar',
            'Si haces mucha parada-arranque, tratarlo como uso severo'
        ],
        items: {
            engine_oil: { name: 'Aceite motor', interval: 15000 },
            oil_filter: { name: 'Filtro de aceite', interval: 15000 },
            cabin_filter: { name: 'Filtro habitaculo', interval: 15000 },
            tires: { name: 'Rotacion de neumaticos', interval: 15000 },
            air_filter: { name: 'Filtro de aire', interval: 45000 },
            brakes: { name: 'Revision de frenos', interval: 30000 },
            hsg_belt_check: { name: 'Inspeccion correa HSG', interval: 15000 },
            coolant: { name: 'Refrigerante', interval: 210000 }
        }
    }
];

export const maintenanceBrands = Array.from(
    new Set(maintenanceTemplates.map((template) => template.brand))
);

export const getModelsByBrand = (brand: string) =>
    maintenanceTemplates.filter((template) => template.brand === brand);
