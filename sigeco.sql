-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-07-2025 a las 18:57:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sigeco`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bases_de_datos`
--

CREATE TABLE `bases_de_datos` (
  `id_base` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `origen` varchar(100) DEFAULT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bases_de_datos`
--

INSERT INTO `bases_de_datos` (`id_base`, `nombre`, `origen`, `fecha_creado`) VALUES
(1, 'Base Importados', 'importacion', '2025-07-09 05:01:12'),
(2, 'Base Manuales', 'manual', '2025-07-09 05:01:12'),
(3, 'Base Fusionadas', 'fusion', '2025-07-09 05:01:12'),
(4, 'Importacion de prueba', 'Importación', '2025-07-09 06:21:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `campanas`
--

CREATE TABLE `campanas` (
  `id_campana` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `id_subevento` int(11) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `estado` enum('Borrador','Activa','Pausada','Finalizada') NOT NULL DEFAULT 'Borrador',
  `url_amigable` varchar(255) DEFAULT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `campanas`
--

INSERT INTO `campanas` (`id_campana`, `id_evento`, `id_subevento`, `nombre`, `estado`, `url_amigable`, `fecha_creado`, `fecha_modificado`) VALUES
(1, 1, NULL, 'Campaña General - Festival de Innovación y Tecnología 2025', 'Activa', 'nueva-campana', '2025-07-09 22:49:50', '2025-07-10 06:33:10'),
(2, 1, 1, 'Campaña de Lanzamiento - Charla IA 2', 'Activa', 'campana', '2025-07-09 22:49:50', '2025-07-10 06:39:52'),
(3, 1, 2, 'TECLA', 'Borrador', NULL, '2025-07-09 23:49:27', '2025-07-09 23:49:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos`
--

CREATE TABLE `contactos` (
  `id_contacto` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `empresa` varchar(255) DEFAULT NULL,
  `actividad` varchar(255) DEFAULT NULL,
  `profesion` varchar(255) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `recibir_mail` tinyint(1) DEFAULT 1,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contactos`
--

INSERT INTO `contactos` (`id_contacto`, `nombre`, `apellido`, `email`, `telefono`, `rut`, `empresa`, `actividad`, `profesion`, `pais`, `recibir_mail`, `fecha_creado`, `fecha_modificado`) VALUES
(1, 'Juan', 'Pérez Test 213', 'juan.perez@mail.cl', '+56932566198', '11111111-1', 'Empresa1', 'Marketing', 'Ingeniero', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 06:06:13'),
(2, 'María', 'González', 'maria.gonzalez@mail.cl', '+56910000002', '22222222-2', 'Empresa2', 'Ventas', 'Analista', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(3, 'Pedro', 'López', 'pedro.lopez@mail.cl', '+56910000003', '33333333-3', 'Empresa3', 'Desarrollo', 'Desarrollador', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(4, 'Ana', 'Ramírez', 'ana.ramirez@mail.cl', '+56910000004', '44444444-4', 'Empresa4', 'Finanzas', 'Contador', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(5, 'Luis', 'González', 'luis.gonzalez@mail.cl', '+56910000005', '55555555-5', 'Empresa5', 'RRHH', 'Administrador', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(6, 'Carla', 'Martínez', 'carla.martinez@mail.cl', '+56910000006', '66666666-6', 'Empresa6', 'Diseño', 'Diseñador', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(7, 'Roberto', 'Soto', 'roberto.soto@mail.cl', '+56910000007', '77777777-7', 'Empresa7', 'Marketing', 'Comunicador', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(8, 'Fernanda', 'Vargas', 'fernanda.vargas@mail.cl', '+56910000008', '88888888-8', 'Empresa8', 'Salud', 'Nutricionista', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(9, 'Sebastián', 'Torres', 'sebastian.torres@mail.cl', '+56910000009', '99999999-9', 'Empresa9', 'Educación', 'Profesor', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(10, 'Daniela', 'Fuentes', 'daniela.fuentes@mail.cl', '+56910000010', '10101010-0', 'Empresa10', 'Medios', 'Periodista', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(11, 'Francisco', 'Méndez', 'francisco.mendez@mail.cl', '+56910000011', '11112222-3', 'Empresa11', 'Desarrollo', 'Desarrollador', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(12, 'Valentina', 'Rojas', 'valentina.rojas@mail.cl', '+56910000012', '12121212-4', 'Empresa12', 'Ventas', 'Ejecutivo', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(13, 'Alejandro', 'Castro', 'alejandro.castro@mail.cl', '+56910000013', '13131313-5', 'Empresa13', 'Finanzas', 'Analista', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(14, 'Camila', 'Paredes', 'camila.paredes@mail.cl', '+56910000014', '14141414-6', 'Empresa14', 'RRHH', 'Especialista', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(15, 'Joaquín', 'Reyes', 'joaquin.reyes@mail.cl', '+56910000015', '15151515-7', 'Empresa15', 'Marketing', 'Community Manager', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(16, 'Isabel', 'Gutiérrez', 'isabel.gutierrez@mail.cl', '+56910000016', '16161616-8', 'Empresa16', 'Diseño', 'UX Designer', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(17, 'Matías', 'Vidal', 'matias.vidal@mail.cl', '+56910000017', '17171717-9', 'Empresa17', 'Desarrollo', 'Full Stack', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(18, 'Francisca', 'Leiva', 'francisca.leiva@mail.cl', '+56910000018', '18181818-0', 'Empresa18', 'Educación', 'Docente', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(19, 'Cristóbal', 'Suárez', 'cristobal.suarez@mail.cl', '+56910000019', '19191919-1', 'Empresa19', 'Medios', 'Editor', 'Chile', 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(20, 'Antonia', 'Muñoz', 'antonia.munoz@mail.cl', '+56910000020', '20202020-2', 'Empresa20', 'Finanzas', 'CFO', 'Chile', 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(21, 'MICHAEL YORDAN', 'SANDOVAL PEDRERO', 'sandovalpedrero@gmail.com', '932566198', '20361677-5', 'MindShot SpA', 'Particular', 'Informatico', 'Chile', 0, '2025-07-09 06:06:36', '2025-07-09 06:06:36'),
(22, 'Jose', 'Rubilar', 'jgrubiar@uc.cl', '56975555833', '19818738-0', 'Empresa Ejemplo S.A.', 'Tecnología', 'Ingeniero de Software', 'Chile', 1, '2025-07-09 06:21:11', '2025-07-09 06:21:11'),
(23, 'Omar', 'Rivero', 'omar.rivero@aicapital.cl', '56978548844', '16285649-9', 'Aicapital', 'Tecnología', 'Informatico', 'Cuba', 1, '2025-07-09 06:21:11', '2025-07-09 06:21:11'),
(27, 'JOSE', 'Rubilar', 'jose@gmail.com', '923324544', '13630163-2', '', '', NULL, 'Chile', 1, '2025-07-10 07:38:54', '2025-07-10 07:38:54'),
(28, 'Maike', 'Yordan', 'jaja@asda.cl', '999887766', '8655062-8', '', '', NULL, 'Chile', 1, '2025-07-10 07:42:59', '2025-07-10 07:42:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos_por_base`
--

CREATE TABLE `contactos_por_base` (
  `id_contacto` int(11) NOT NULL,
  `id_base` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `contactos_por_base`
--

INSERT INTO `contactos_por_base` (`id_contacto`, `id_base`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 2),
(12, 2),
(13, 2),
(14, 2),
(15, 2),
(16, 3),
(17, 3),
(18, 3),
(19, 3),
(20, 3),
(22, 4),
(23, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id_evento` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ciudad` varchar(255) NOT NULL,
  `lugar` varchar(255) NOT NULL,
  `presupuesto_marketing` decimal(15,2) DEFAULT NULL,
  `estado` int(11) NOT NULL DEFAULT 1,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id_evento`, `nombre`, `fecha_inicio`, `fecha_fin`, `ciudad`, `lugar`, `presupuesto_marketing`, `estado`, `fecha_creado`, `fecha_modificado`) VALUES
(1, 'Evento 1', '2025-09-01 10:00:00', '2025-09-01 18:00:00', 'Santiago', 'Centro Convenciones', 10000.00, 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(2, 'Evento 2', '2025-09-05 09:00:00', '2025-09-05 17:00:00', 'Valparaíso', 'Auditorio Municipal', 12000.00, 2, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(3, 'Evento 3', '2025-09-10 08:00:00', '2025-09-10 16:00:00', 'Concepción', 'Teatro UdeC', 15000.00, 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(4, 'Evento 4', '2025-10-01 11:00:00', '2025-10-01 19:00:00', 'Antofagasta', 'Estadio Regional', 9000.00, 3, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(5, 'Evento 5', '2025-10-10 09:30:00', '2025-10-10 17:30:00', 'La Serena', 'Centro Cultural', 7000.00, 4, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(6, 'Evento 6', '2025-11-01 10:00:00', '2025-11-01 18:00:00', 'Temuco', 'Palacio de Congresos', 11000.00, 1, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(7, 'Evento 7', '2025-11-08 09:00:00', '2025-11-08 17:00:00', 'Rancagua', 'Teatro Regional', 13000.00, 2, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(8, 'Evento 8', '2025-11-15 11:30:00', '2025-11-15 19:30:00', 'Puerto Montt', 'Anfiteatro', 14000.00, 2, '2025-07-09 05:01:12', '2025-07-09 05:01:20'),
(9, 'Evento 9', '2025-12-01 10:00:00', '2025-12-01 18:00:00', 'Iquique', 'Sala Expo', 8500.00, 3, '2025-07-09 05:01:12', '2025-07-09 05:01:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `id_inscripcion` int(11) NOT NULL,
  `id_campana` int(11) NOT NULL,
  `id_contacto` int(11) NOT NULL,
  `id_tipo_entrada` int(11) DEFAULT NULL,
  `estado_asistencia` enum('Invitado','Registrado','Confirmado','Asistió','Cancelado') NOT NULL,
  `estado_pago` enum('No Aplica','Pendiente','Pagado','Rechazado','Reembolsado') NOT NULL,
  `codigo_qr` varchar(255) DEFAULT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inscripciones`
--

INSERT INTO `inscripciones` (`id_inscripcion`, `id_campana`, `id_contacto`, `id_tipo_entrada`, `estado_asistencia`, `estado_pago`, `codigo_qr`, `fecha_inscripcion`) VALUES
(1, 2, 1, NULL, 'Invitado', 'Pendiente', NULL, '2025-07-09 22:49:50'),
(2, 1, 2, NULL, 'Confirmado', 'Pagado', NULL, '2025-07-09 22:49:50'),
(6, 2, 27, NULL, 'Invitado', 'No Aplica', NULL, '2025-07-10 07:41:40'),
(7, 2, 28, NULL, 'Registrado', 'No Aplica', NULL, '2025-07-10 07:42:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subeventos`
--

CREATE TABLE `subeventos` (
  `id_subevento` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `ciudad` varchar(255) DEFAULT NULL,
  `lugar` varchar(255) DEFAULT NULL,
  `link_adicional` text DEFAULT NULL,
  `texto_libre` text DEFAULT NULL,
  `nombre_evento_mailing` varchar(255) DEFAULT NULL,
  `fecha_hora_mailing` datetime DEFAULT NULL,
  `asunto_mailing` varchar(255) DEFAULT NULL,
  `remitente_mailing` varchar(255) DEFAULT NULL,
  `ruta_texto_mailing` varchar(255) DEFAULT NULL,
  `ruta_imagen_mailing` varchar(255) DEFAULT NULL,
  `ruta_formulario` varchar(255) DEFAULT NULL,
  `sitio_web` varchar(255) DEFAULT NULL,
  `obligatorio_registro` tinyint(1) NOT NULL DEFAULT 0,
  `obligatorio_pago` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `subeventos`
--

INSERT INTO `subeventos` (`id_subevento`, `id_evento`, `nombre`, `fecha_inicio`, `fecha_fin`, `ciudad`, `lugar`, `link_adicional`, `texto_libre`, `nombre_evento_mailing`, `fecha_hora_mailing`, `asunto_mailing`, `remitente_mailing`, `ruta_texto_mailing`, `ruta_imagen_mailing`, `ruta_formulario`, `sitio_web`, `obligatorio_registro`, `obligatorio_pago`, `fecha_creado`, `fecha_modificado`) VALUES
(1, 1, 'Subevento 1A', '2025-09-01 10:00:00', '2025-09-01 12:00:00', 'Santiago', 'Sala A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-10 07:43:23'),
(2, 1, 'Subevento 1B', '2025-09-01 12:30:00', '2025-09-01 14:30:00', 'Santiago', 'Sala B', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(3, 1, 'Subevento 1C', '2025-09-01 15:00:00', '2025-09-01 17:00:00', 'Santiago', 'Sala C', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(4, 2, 'Subevento 2AAAA', '2025-09-05 13:00:00', '2025-09-05 15:00:00', 'Valparaíso', 'Auditorio 1', '', '', '', '0000-00-00 00:00:00', '', '', '', '', '', '', 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:15:42'),
(5, 2, 'Subevento 2B', '2025-09-05 11:30:00', '2025-09-05 13:30:00', 'Valparaíso', 'Auditorio 2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(6, 2, 'Subevento 2C', '2025-09-05 14:00:00', '2025-09-05 16:00:00', 'Valparaíso', 'Auditorio 3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(7, 3, 'Subevento 3A', '2025-09-10 08:00:00', '2025-09-10 10:00:00', 'Concepción', 'Sala X', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(8, 3, 'Subevento 3B', '2025-09-10 10:30:00', '2025-09-10 12:30:00', 'Concepción', 'Sala Y', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(9, 4, 'Subevento 4A', '2025-10-01 11:00:00', '2025-10-01 13:00:00', 'Antofagasta', 'Estadio A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(10, 4, 'Subevento 4B', '2025-10-01 13:30:00', '2025-10-01 15:30:00', 'Antofagasta', 'Estadio B', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(11, 5, 'Subevento 5A', '2025-10-10 09:30:00', '2025-10-10 11:30:00', 'La Serena', 'Centro Cultural A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(12, 5, 'Subevento 5B', '2025-10-10 12:00:00', '2025-10-10 14:00:00', 'La Serena', 'Centro Cultural B', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(13, 6, 'Subevento 6A', '2025-11-01 10:00:00', '2025-11-01 12:00:00', 'Temuco', 'Palacio A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(14, 6, 'Subevento 6B', '2025-11-01 13:00:00', '2025-11-01 15:00:00', 'Temuco', 'Palacio B', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(15, 7, 'Subevento 7A', '2025-11-08 09:00:00', '2025-11-08 11:00:00', 'Rancagua', 'Teatro A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(16, 8, 'Subevento 8A', '2025-11-15 08:30:00', '2025-11-15 10:30:00', 'Puerto Montt', 'Anfiteatro A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(17, 9, 'Subevento 9A', '2025-12-01 10:00:00', '2025-12-01 12:00:00', 'Iquique', 'Sala Expo A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(18, 9, 'Subevento 9B', '2025-12-01 13:00:00', '2025-12-01 15:00:00', 'Iquique', 'Sala Expo B', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 05:01:12', '2025-07-09 05:01:12'),
(21, 1, 'Charla Inaugural: El Futuro de la IA', '2025-10-20 10:00:00', '2025-10-20 11:30:00', NULL, 'Salón Principal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:47:16', '2025-07-09 22:47:16'),
(22, 1, 'Workshop de Desarrollo Web 3.0', '2025-10-21 09:00:00', '2025-10-21 13:00:00', NULL, 'Sala A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:47:16', '2025-07-09 22:47:16'),
(23, 1, 'Feria de Startups Tecnológicas', '2025-10-22 10:00:00', '2025-10-22 17:00:00', NULL, 'Pabellón Central', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:47:16', '2025-07-09 22:47:16'),
(24, 1, 'Charla Inaugural: El Futuro de la IA', '2025-10-20 10:00:00', '2025-10-20 11:30:00', NULL, 'Salón Principal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:48:41', '2025-07-09 22:48:41'),
(25, 1, 'Workshop de Desarrollo Web 3.0', '2025-10-21 09:00:00', '2025-10-21 13:00:00', NULL, 'Sala A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:48:41', '2025-07-09 22:48:41'),
(26, 1, 'Feria de Startups Tecnológicas', '2025-10-22 10:00:00', '2025-10-22 17:00:00', NULL, 'Pabellón Central', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:48:41', '2025-07-09 22:48:41'),
(27, 1, 'TES TEST', '2025-10-20 10:00:00', '2025-10-20 11:30:00', NULL, 'Salón Principal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:31', '2025-07-09 23:49:13'),
(28, 1, 'Workshop de Desarrollo Web 3.0', '2025-10-21 09:00:00', '2025-10-21 13:00:00', NULL, 'Sala A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:31', '2025-07-09 22:49:31'),
(29, 1, 'Feria de Startups Tecnológicas', '2025-10-22 10:00:00', '2025-10-22 17:00:00', NULL, 'Pabellón Central', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:31', '2025-07-09 22:49:31'),
(30, 1, 'Charla Inaugural: El Futuro de la IA', '2025-10-20 10:00:00', '2025-10-20 11:30:00', NULL, 'Salón Principal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:50', '2025-07-09 22:49:50'),
(31, 1, 'Workshop de Desarrollo Web 3.0', '2025-10-21 09:00:00', '2025-10-21 13:00:00', NULL, 'Sala A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:50', '2025-07-09 22:49:50'),
(32, 1, 'Feria de Startups Tecnológicas', '2025-10-22 10:00:00', '2025-10-22 17:00:00', NULL, 'Pabellón Central', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-07-09 22:49:50', '2025-07-09 22:49:50');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_de_entrada`
--

CREATE TABLE `tipos_de_entrada` (
  `id_tipo_entrada` int(11) NOT NULL,
  `id_campana` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cantidad_total` int(11) DEFAULT NULL,
  `cantidad_vendida` int(11) NOT NULL DEFAULT 0,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_creado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `fecha_creado`) VALUES
(1, 'Usuario Prueba', 'test@example.com', '$2a$12$PSrkhz7NV8ymaSTy0TsENOleGHzt6pdq4Bb7o09Y4lcGdy5OUUFJ6', '2025-07-09 04:30:32');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bases_de_datos`
--
ALTER TABLE `bases_de_datos`
  ADD PRIMARY KEY (`id_base`);

--
-- Indices de la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD PRIMARY KEY (`id_campana`),
  ADD UNIQUE KEY `url_amigable` (`url_amigable`),
  ADD KEY `id_evento` (`id_evento`),
  ADD KEY `id_subevento` (`id_subevento`);

--
-- Indices de la tabla `contactos`
--
ALTER TABLE `contactos`
  ADD PRIMARY KEY (`id_contacto`);

--
-- Indices de la tabla `contactos_por_base`
--
ALTER TABLE `contactos_por_base`
  ADD PRIMARY KEY (`id_contacto`,`id_base`),
  ADD KEY `id_base` (`id_base`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id_evento`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD PRIMARY KEY (`id_inscripcion`),
  ADD UNIQUE KEY `codigo_qr` (`codigo_qr`),
  ADD KEY `id_contacto` (`id_contacto`),
  ADD KEY `id_tipo_entrada` (`id_tipo_entrada`),
  ADD KEY `id_campana` (`id_campana`) USING BTREE;

--
-- Indices de la tabla `subeventos`
--
ALTER TABLE `subeventos`
  ADD PRIMARY KEY (`id_subevento`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  ADD PRIMARY KEY (`id_tipo_entrada`),
  ADD KEY `id_campana` (`id_campana`) USING BTREE;

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bases_de_datos`
--
ALTER TABLE `bases_de_datos`
  MODIFY `id_base` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `campanas`
--
ALTER TABLE `campanas`
  MODIFY `id_campana` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `contactos`
--
ALTER TABLE `contactos`
  MODIFY `id_contacto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  MODIFY `id_inscripcion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `subeventos`
--
ALTER TABLE `subeventos`
  MODIFY `id_subevento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  MODIFY `id_tipo_entrada` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `campanas`
--
ALTER TABLE `campanas`
  ADD CONSTRAINT `campanas_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE,
  ADD CONSTRAINT `campanas_ibfk_2` FOREIGN KEY (`id_subevento`) REFERENCES `subeventos` (`id_subevento`) ON DELETE SET NULL;

--
-- Filtros para la tabla `contactos_por_base`
--
ALTER TABLE `contactos_por_base`
  ADD CONSTRAINT `contactos_por_base_ibfk_1` FOREIGN KEY (`id_contacto`) REFERENCES `contactos` (`id_contacto`) ON DELETE CASCADE,
  ADD CONSTRAINT `contactos_por_base_ibfk_2` FOREIGN KEY (`id_base`) REFERENCES `bases_de_datos` (`id_base`) ON DELETE CASCADE;

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_contacto`) REFERENCES `contactos` (`id_contacto`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_3` FOREIGN KEY (`id_tipo_entrada`) REFERENCES `tipos_de_entrada` (`id_tipo_entrada`) ON DELETE SET NULL;

--
-- Filtros para la tabla `subeventos`
--
ALTER TABLE `subeventos`
  ADD CONSTRAINT `subeventos_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tipos_de_entrada`
--
ALTER TABLE `tipos_de_entrada`
  ADD CONSTRAINT `tipos_de_entrada_ibfk_1` FOREIGN KEY (`id_campana`) REFERENCES `campanas` (`id_campana`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
