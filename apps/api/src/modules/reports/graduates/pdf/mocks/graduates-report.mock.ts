// Datos de prueba del reporte de titulados. El PDF los muestra en este mismo orden.
// Ingeniería de Sistemas: son los MISMOS titulados de la tabla de /reports
// (apps/web/src/modules/reports/data/graduates.mock.ts), con los mismos datos y en el mismo orden:
// 72 verificados y 18 observados. Si cambia esa tabla, hay que actualizar este archivo.
// Ingeniería Informática: 10 verificados y 5 observados, para probar el filtro por carrera.
// Tienen la misma forma que la consulta a Supabase: solicitud + detalle_solicitud + dictamen.
import { ReportMockData } from '../types/report-source.types';

export const GRADUATES_REPORT_MOCK: ReportMockData = {
  "carreras": [
    {
      "id": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
      "nombre": "Ingeniería de Sistemas"
    },
    {
      "id": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d",
      "nombre": "Ingeniería Informática"
    }
  ],
  "solicitudes": [
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Valeria Sofía",
        "apellido": "Morales Albarracín",
        "cod_sis": "201804921",
        "telefono": "+591 79519163",
        "email": "valeria.morales@postgrado.uc.edu",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-10-24",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 8 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-11-25T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Marcelo Andrés",
        "apellido": "Quispe Condori",
        "cod_sis": "201709122",
        "telefono": "+591 78156169",
        "email": "marcelo.quispe@est.uc.edu",
        "fecha_ingreso": "2017-03-05",
        "fecha_titulacion": "2024-09-15",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-11-18T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniela Fernanda",
        "apellido": "Espinosa Toledo",
        "cod_sis": "201901844",
        "telefono": "+591 72019483",
        "email": "daniela.espinosa@alumni.uc.edu",
        "fecha_ingreso": "2019-02-14",
        "fecha_titulacion": "2024-11-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 8 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-10-01T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Diego Armando",
        "apellido": "Salazar Justiniano",
        "cod_sis": "201805510",
        "telefono": "+591 76543210",
        "email": "diego.salazar@est.uc.edu",
        "fecha_ingreso": "2018-08-11",
        "fecha_titulacion": "2024-10-02",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2025-10-30T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Camilo Ernesto",
        "apellido": "Villarroel Cadima",
        "cod_sis": "201708301",
        "telefono": "+591 71192834",
        "email": "camilo.villarroel@postgrado.uc.edu",
        "fecha_ingreso": "2017-03-01",
        "fecha_titulacion": "2024-08-28",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-05-18T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Luciana Belén",
        "apellido": "Arce Baldivieso",
        "cod_sis": "201903490",
        "telefono": "+591 73384910",
        "email": "luciana.arce@alumni.uc.edu",
        "fecha_ingreso": "2019-02-15",
        "fecha_titulacion": "2024-10-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 8 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-03-02T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Álvaro Mateo",
        "apellido": "Camacho Zeballos",
        "cod_sis": "201802119",
        "telefono": "+591 74492018",
        "email": "alvaro.camacho@est.uc.edu",
        "fecha_ingreso": "2018-08-06",
        "fecha_titulacion": "2024-11-11",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 3 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-10-05T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Mariana Elena",
        "apellido": "Paz Soldán",
        "cod_sis": "201907723",
        "telefono": "+591 75583920",
        "email": "mariana.paz@est.uc.edu",
        "fecha_ingreso": "2019-02-10",
        "fecha_titulacion": "2024-12-01",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-05-08T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Rodrigo Ignacio",
        "apellido": "Guzmán Terrazas",
        "cod_sis": "201704612",
        "telefono": "+591 76619283",
        "email": "rodrigo.guzman@postgrado.uc.edu",
        "fecha_ingreso": "2017-03-02",
        "fecha_titulacion": "2024-11-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 8 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-03-12T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Brenda Paulina",
        "apellido": "Navarro Claure",
        "cod_sis": "201809003",
        "telefono": "+591 77728194",
        "email": "brenda.navarro@alumni.uc.edu",
        "fecha_ingreso": "2018-08-12",
        "fecha_titulacion": "2024-10-20",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 2 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-02-02T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "María René",
        "apellido": "Flores Choque",
        "cod_sis": "201901842",
        "telefono": "+591 72145892",
        "email": "rene.flores@umss.edu.bo",
        "fecha_ingreso": "2019-08-10",
        "fecha_titulacion": "2024-12-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 4 meses"
      },
      "dictamen": {
        "fecha_creacion": "2025-01-15T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Laura Andrea",
        "apellido": "Camacho Rojas",
        "cod_sis": "201604233",
        "telefono": "+591 72845190",
        "email": "laura.camacho@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "María Elena",
        "apellido": "Quispe Mamani",
        "cod_sis": "201804512",
        "telefono": "+591 71234567",
        "email": "maria.quispe@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Diego Armando",
        "apellido": "Flores Sejas",
        "cod_sis": "201903344",
        "telefono": "+591 70045512",
        "email": "diego.flores@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-09T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Rosa Beatriz",
        "apellido": "Mamani Choque",
        "cod_sis": "201805871",
        "telefono": "+591 76612034",
        "email": "rosa.mamani@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-09T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Carlos Alberto",
        "apellido": "Terceros Vargas",
        "cod_sis": "201501778",
        "telefono": "+591 71190228",
        "email": "carlos.terceros@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Ana Gabriela",
        "apellido": "Villarroel Antezana",
        "cod_sis": "201702290",
        "telefono": "+591 79923845",
        "email": "ana.villarroel@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Mario Fernando",
        "apellido": "Claros Montaño",
        "cod_sis": "201604910",
        "telefono": "+591 73320087",
        "email": "mario.claros@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-11T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Silvia Marcela",
        "apellido": "Rojas Peredo",
        "cod_sis": "202006655",
        "telefono": "+591 75534901",
        "email": "silvia.rojas@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-11T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Pablo Andrés",
        "apellido": "Guzmán Arispe",
        "cod_sis": "201703487",
        "telefono": "+591 71708294",
        "email": "pablo.guzman@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-14T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Elena Sofía",
        "apellido": "Vargas Ledezma",
        "cod_sis": "201901126",
        "telefono": "+591 78845613",
        "email": "elena.vargas@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-14T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Ronald Javier",
        "apellido": "Céspedes Arce",
        "cod_sis": "201605742",
        "telefono": "+591 72214960",
        "email": "ronald.cespedes@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Gabriela Inés",
        "apellido": "Soria Bustamante",
        "cod_sis": "201502019",
        "telefono": "+591 76650338",
        "email": "gabriela.soria@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Iván Sebastián",
        "apellido": "Montaño Ríos",
        "cod_sis": "201706118",
        "telefono": "+591 70983127",
        "email": "ivan.montano@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-16T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Verónica Alejandra",
        "apellido": "Peña Salazar",
        "cod_sis": "201902255",
        "telefono": "+591 79017743",
        "email": "veronica.pena@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-16T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniela Patricia",
        "apellido": "Arce Ondarza",
        "cod_sis": "202007390",
        "telefono": "+591 77742015",
        "email": "daniela.arce@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-17T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Fernando Gabriel",
        "apellido": "Ríos Zeballos",
        "cod_sis": "201503864",
        "telefono": "+591 71356208",
        "email": "fernando.rios@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-17T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Patricia Carolina",
        "apellido": "Mejía Torrico",
        "cod_sis": "201607205",
        "telefono": "+591 74428830",
        "email": "patricia.mejia@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "9 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-18T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Álvaro Ignacio",
        "apellido": "Zeballos Núñez",
        "cod_sis": "201904471",
        "telefono": "+591 78190562",
        "email": "alvaro.zeballos@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-18T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Andrea Paola",
        "apellido": "Aguilar Ramos",
        "cod_sis": "201864813",
        "telefono": "+591 73793371",
        "email": "andrea.aguilar@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Bruno Iván",
        "apellido": "Alanoca Vidal",
        "cod_sis": "201623084",
        "telefono": "+591 73229132",
        "email": "bruno.alanoca@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Carla Inés",
        "apellido": "Apaza Luna",
        "cod_sis": "201971355",
        "telefono": "+591 72664893",
        "email": "carla.apaza@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniel José",
        "apellido": "Ayala Soto",
        "cod_sis": "201729626",
        "telefono": "+591 72100654",
        "email": "daniel.ayala@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Erika Luz",
        "apellido": "Bravo Mena",
        "cod_sis": "202077897",
        "telefono": "+591 71536415",
        "email": "erika.bravo@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Franco Abel",
        "apellido": "Cáceres Rivas",
        "cod_sis": "201536168",
        "telefono": "+591 79972176",
        "email": "franco.caceres@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Gisela Ana",
        "apellido": "Calle Tapia",
        "cod_sis": "201884439",
        "telefono": "+591 79407937",
        "email": "gisela.calle@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Hugo Raúl",
        "apellido": "Condori Cruz",
        "cod_sis": "201642710",
        "telefono": "+591 78843698",
        "email": "hugo.condori@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-19T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Andrea Paola",
        "apellido": "Durán Ramos",
        "cod_sis": "201990981",
        "telefono": "+591 78279459",
        "email": "andrea.duran@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Bruno Iván",
        "apellido": "Espinoza Vidal",
        "cod_sis": "201749252",
        "telefono": "+591 77715220",
        "email": "bruno.espinoza@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Carla Inés",
        "apellido": "Fernández Luna",
        "cod_sis": "202097523",
        "telefono": "+591 77150981",
        "email": "carla.fernandez@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniel José",
        "apellido": "Gutiérrez Soto",
        "cod_sis": "201555794",
        "telefono": "+591 76586742",
        "email": "daniel.gutierrez@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Erika Luz",
        "apellido": "Huanca Mena",
        "cod_sis": "201814065",
        "telefono": "+591 76022503",
        "email": "erika.huanca@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Franco Abel",
        "apellido": "Jiménez Rivas",
        "cod_sis": "201662336",
        "telefono": "+591 75458264",
        "email": "franco.jimenez@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Gisela Ana",
        "apellido": "López Tapia",
        "cod_sis": "201920607",
        "telefono": "+591 74894025",
        "email": "gisela.lopez@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Hugo Raúl",
        "apellido": "Mercado Cruz",
        "cod_sis": "201768878",
        "telefono": "+591 74329786",
        "email": "hugo.mercado@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-20T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Andrea Paola",
        "apellido": "Nina Ramos",
        "cod_sis": "202027149",
        "telefono": "+591 73765547",
        "email": "andrea.nina@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Bruno Iván",
        "apellido": "Orellana Vidal",
        "cod_sis": "201575420",
        "telefono": "+591 73201308",
        "email": "bruno.orellana@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Carla Inés",
        "apellido": "Paredes Luna",
        "cod_sis": "201833691",
        "telefono": "+591 72637069",
        "email": "carla.paredes@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniel José",
        "apellido": "Quiroga Soto",
        "cod_sis": "201681962",
        "telefono": "+591 72072830",
        "email": "daniel.quiroga@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Erika Luz",
        "apellido": "Rocha Mena",
        "cod_sis": "201940233",
        "telefono": "+591 71508591",
        "email": "erika.rocha@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Franco Abel",
        "apellido": "Salinas Rivas",
        "cod_sis": "201788504",
        "telefono": "+591 79944352",
        "email": "franco.salinas@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Gisela Ana",
        "apellido": "Ticona Tapia",
        "cod_sis": "202046775",
        "telefono": "+591 79380113",
        "email": "gisela.ticona@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Hugo Raúl",
        "apellido": "Urquidi Cruz",
        "cod_sis": "201595046",
        "telefono": "+591 78815874",
        "email": "hugo.urquidi@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Nicolás Esteban",
        "apellido": "Nava Ortuño",
        "cod_sis": "201909913",
        "telefono": "+591 70952229",
        "email": "nicolas.nava@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Bruno Sebastián",
        "apellido": "Iriarte Lazo",
        "cod_sis": "202009236",
        "telefono": "+591 72879263",
        "email": "bruno.iriarte@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Álvaro Gonzalo",
        "apellido": "Fuentes Quiroga",
        "cod_sis": "201804308",
        "telefono": "+591 70483043",
        "email": "alvaro.fuentes@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Elena Patricia",
        "apellido": "Pinto Jiménez",
        "cod_sis": "201608916",
        "telefono": "+591 76520970",
        "email": "elena.pinto@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Tatiana Elizabeth",
        "apellido": "Benavides Quiroga",
        "cod_sis": "201501497",
        "telefono": "+591 74923439",
        "email": "tatiana.benavides@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Renata Beatriz",
        "apellido": "Paz Heredia",
        "cod_sis": "201501125",
        "telefono": "+591 77790183",
        "email": "renata.paz@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Karen Daniela",
        "apellido": "Rivera Valdivia",
        "cod_sis": "202007937",
        "telefono": "+591 77247949",
        "email": "karen.rivera@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Isabel Cristina",
        "apellido": "Nava Dávila",
        "cod_sis": "201607296",
        "telefono": "+591 77181704",
        "email": "isabel.nava@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Elena Patricia",
        "apellido": "Galarza Escalera",
        "cod_sis": "201909989",
        "telefono": "+591 70750759",
        "email": "elena.galarza@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Gabriela Sofía",
        "apellido": "Dávila Echeverría",
        "cod_sis": "201702484",
        "telefono": "+591 79121570",
        "email": "gabriela.davila@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-22T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Nicolás Esteban",
        "apellido": "Valdivia Galarza",
        "cod_sis": "201507889",
        "telefono": "+591 77673486",
        "email": "nicolas.valdivia@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Bruno Sebastián",
        "apellido": "Tapia Escalera",
        "cod_sis": "201702577",
        "telefono": "+591 74021083",
        "email": "bruno.tapia@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Yerko Andrés",
        "apellido": "Ferrufino Iriarte",
        "cod_sis": "201706700",
        "telefono": "+591 77319125",
        "email": "yerko.ferrufino@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Pablo Ernesto",
        "apellido": "Antezana Orellana",
        "cod_sis": "201907390",
        "telefono": "+591 70541831",
        "email": "pablo.antezana@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Tatiana Elizabeth",
        "apellido": "Cabrera Jiménez",
        "cod_sis": "201509564",
        "telefono": "+591 71871305",
        "email": "tatiana.cabrera@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Tatiana Elizabeth",
        "apellido": "Lazo Cabrera",
        "cod_sis": "201601558",
        "telefono": "+591 70321281",
        "email": "tatiana.lazo@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Jorge Alberto",
        "apellido": "Fuentes Dávila",
        "cod_sis": "201803685",
        "telefono": "+591 71073935",
        "email": "jorge.fuentes@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniel Ignacio",
        "apellido": "Terrazas Lafuente",
        "cod_sis": "201501541",
        "telefono": "+591 70344122",
        "email": "daniel.terrazas@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Adriana Lucía",
        "apellido": "Fuentes Paz",
        "cod_sis": "201709037",
        "telefono": "+591 75396447",
        "email": "adriana.fuentes@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Adriana Lucía",
        "apellido": "Rivera Delgado",
        "cod_sis": "201502816",
        "telefono": "+591 73471021",
        "email": "adriana.rivera@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-23T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Jorge Alberto",
        "apellido": "Gamboa Quiroga",
        "cod_sis": "201603383",
        "telefono": "+591 79995603",
        "email": "jorge.gamboa@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-24T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "María Fernanda",
        "apellido": "Navarro Camargo",
        "cod_sis": "201906182",
        "telefono": "+591 71367046",
        "email": "maria.navarro@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-24T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Álvaro Gonzalo",
        "apellido": "Navarro Escalera",
        "cod_sis": "201601723",
        "telefono": "+591 70397564",
        "email": "alvaro.navarro@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-24T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Marcelo Andrés",
        "apellido": "Aguilar Rocha",
        "cod_sis": "201705532",
        "telefono": "+591 71456023",
        "email": "marcelo.aguilar@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-07T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Lucía Fernanda",
        "apellido": "Balderrama Vega",
        "cod_sis": "201802217",
        "telefono": "+591 72308841",
        "email": "lucia.balderrama@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-07T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Jorge Luis",
        "apellido": "Cardozo Pinto",
        "cod_sis": "201604675",
        "telefono": "+591 76120459",
        "email": "jorge.cardozo@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Paola Andrea",
        "apellido": "Delgadillo Ríos",
        "cod_sis": "201903918",
        "telefono": "+591 79354102",
        "email": "paola.delgadillo@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Rodrigo Iván",
        "apellido": "Escóbar Luna",
        "cod_sis": "201506244",
        "telefono": "+591 70782316",
        "email": "rodrigo.escobar@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-09T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Carla Daniela",
        "apellido": "Fernández Soto",
        "cod_sis": "202001873",
        "telefono": "+591 75219604",
        "email": "carla.fernandez@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-09T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Luis Alberto",
        "apellido": "Gutiérrez Paz",
        "cod_sis": "201707140",
        "telefono": "+591 73664027",
        "email": "luis.gutierrez@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "8 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Natalia Sofía",
        "apellido": "Herrera Vidal",
        "cod_sis": "201805396",
        "telefono": "+591 71893350",
        "email": "natalia.herrera@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Andrés Felipe",
        "apellido": "Iriarte Molina",
        "cod_sis": "201602981",
        "telefono": "+591 77405128",
        "email": "andres.iriarte@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-11T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Valeria Beatriz",
        "apellido": "Jiménez Arce",
        "cod_sis": "201904157",
        "telefono": "+591 78562903",
        "email": "valeria.jimenez@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "6 años 6 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-11T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Miguel Ángel",
        "apellido": "Lazarte Cruz",
        "cod_sis": "201503620",
        "telefono": "+591 72147786",
        "email": "miguel.lazarte@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 9 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-14T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Susana Elizabeth",
        "apellido": "Medrano Paz",
        "cod_sis": "201708829",
        "telefono": "+591 79630214",
        "email": "susana.medrano@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 5 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-14T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Óscar Eduardo",
        "apellido": "Navia Salinas",
        "cod_sis": "202005461",
        "telefono": "+591 70258837",
        "email": "oscar.navia@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "5 años 10 meses"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Mónica Isabel",
        "apellido": "Orellana Vargas",
        "cod_sis": "201806713",
        "telefono": "+591 76941052",
        "email": "monica.orellana@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c",
        "duracion_carrera": "7 años 1 mes"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Daniela Sofía",
        "apellido": "Alcócer Vargas",
        "cod_sis": "201703125",
        "telefono": "+591 71830264",
        "email": "daniela.alcocer@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Marco Antonio",
        "apellido": "Bustillos Rojas",
        "cod_sis": "201802376",
        "telefono": "+591 72419058",
        "email": "marco.bustillos@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-09T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Ana Lucía",
        "apellido": "Calle Mamani",
        "cod_sis": "201604418",
        "telefono": "+591 76250913",
        "email": "ana.calle@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Javier Ernesto",
        "apellido": "Duarte Pozo",
        "cod_sis": "201905632",
        "telefono": "+591 70347185",
        "email": "javier.duarte@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-11T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Paola Andrea",
        "apellido": "Encinas Torrico",
        "cod_sis": "201502849",
        "telefono": "+591 79112640",
        "email": "paola.encinas@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-14T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Rodrigo Martín",
        "apellido": "Flores Ayala",
        "cod_sis": "202001957",
        "telefono": "+591 73586402",
        "email": "rodrigo.flores@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Carla Beatriz",
        "apellido": "Guardia Salinas",
        "cod_sis": "201706731",
        "telefono": "+591 77024319",
        "email": "carla.guardia@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-16T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Luis Fernando",
        "apellido": "Huanca Quispe",
        "cod_sis": "201804284",
        "telefono": "+591 71965827",
        "email": "luis.huanca@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-17T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Sofía Alejandra",
        "apellido": "Inturias Pérez",
        "cod_sis": "201605093",
        "telefono": "+591 72673041",
        "email": "sofia.inturias@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-18T10:00:00Z"
      }
    },
    {
      "estado": "verificado",
      "detalle_solicitud": {
        "nombre": "Diego Andrés",
        "apellido": "Jaldín Rocha",
        "cod_sis": "201902518",
        "telefono": "+591 78150396",
        "email": "diego.jaldin@est.umss.edu.bo",
        "fecha_ingreso": "2019-02-11",
        "fecha_titulacion": "2025-08-29",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Rosa Elena",
        "apellido": "Kantuta Choque",
        "cod_sis": "201707846",
        "telefono": "+591 70892153",
        "email": "rosa.kantuta@est.umss.edu.bo",
        "fecha_ingreso": "2017-02-13",
        "fecha_titulacion": "2024-07-18",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-08T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Miguel Ángel",
        "apellido": "López Arnez",
        "cod_sis": "201503367",
        "telefono": "+591 76409285",
        "email": "miguel.lopez@est.umss.edu.bo",
        "fecha_ingreso": "2015-02-09",
        "fecha_titulacion": "2022-12-05",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-10T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Gabriela Inés",
        "apellido": "Montaño Vidal",
        "cod_sis": "202004215",
        "telefono": "+591 79586430",
        "email": "gabriela.montano@est.umss.edu.bo",
        "fecha_ingreso": "2020-02-10",
        "fecha_titulacion": "2025-12-19",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-15T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Hugo Rafael",
        "apellido": "Nogales Cruz",
        "cod_sis": "201806640",
        "telefono": "+591 73201768",
        "email": "hugo.nogales@est.umss.edu.bo",
        "fecha_ingreso": "2018-02-12",
        "fecha_titulacion": "2025-03-14",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-17T10:00:00Z"
      }
    },
    {
      "estado": "observado",
      "detalle_solicitud": {
        "nombre": "Valeria Isabel",
        "apellido": "Orosco Fuentes",
        "cod_sis": "201604972",
        "telefono": "+591 71478502",
        "email": "valeria.orosco@est.umss.edu.bo",
        "fecha_ingreso": "2016-02-05",
        "fecha_titulacion": "2023-11-22",
        "id_carrera": "c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d"
      },
      "dictamen": {
        "fecha_creacion": "2026-09-21T10:00:00Z"
      }
    }
  ]
};
