--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.workouts DROP CONSTRAINT IF EXISTS workouts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_workout_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_exercise_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_equipment DROP CONSTRAINT IF EXISTS user_equipment_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_equipment DROP CONSTRAINT IF EXISTS user_equipment_equipment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_exercise_log_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exercise_logs DROP CONSTRAINT IF EXISTS exercise_logs_workout_log_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exercise_logs DROP CONSTRAINT IF EXISTS exercise_logs_exercise_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workouts DROP CONSTRAINT IF EXISTS workouts_pkey;
ALTER TABLE IF EXISTS ONLY public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_equipment DROP CONSTRAINT IF EXISTS user_equipment_pkey;
ALTER TABLE IF EXISTS ONLY public.progress DROP CONSTRAINT IF EXISTS progress_pkey;
ALTER TABLE IF EXISTS ONLY public.exercises DROP CONSTRAINT IF EXISTS exercises_pkey;
ALTER TABLE IF EXISTS ONLY public.exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_pkey;
ALTER TABLE IF EXISTS ONLY public.exercise_logs DROP CONSTRAINT IF EXISTS exercise_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.equipment DROP CONSTRAINT IF EXISTS equipment_pkey;
ALTER TABLE IF EXISTS ONLY public.equipment DROP CONSTRAINT IF EXISTS equipment_name_key;
ALTER TABLE IF EXISTS public.exercise_sets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exercise_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.equipment ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.workouts;
DROP TABLE IF EXISTS public.workout_logs;
DROP TABLE IF EXISTS public.workout_exercises;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_equipment;
DROP TABLE IF EXISTS public.progress;
DROP TABLE IF EXISTS public.exercises;
DROP SEQUENCE IF EXISTS public.exercise_sets_id_seq;
DROP TABLE IF EXISTS public.exercise_sets;
DROP SEQUENCE IF EXISTS public.exercise_logs_id_seq;
DROP TABLE IF EXISTS public.exercise_logs;
DROP SEQUENCE IF EXISTS public.equipment_id_seq;
DROP TABLE IF EXISTS public.equipment;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id integer NOT NULL,
    name character varying(100)
);


--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: exercise_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_logs (
    id integer NOT NULL,
    workout_log_id uuid,
    exercise_id uuid,
    difficulty integer
);


--
-- Name: exercise_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercise_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercise_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercise_logs_id_seq OWNED BY public.exercise_logs.id;


--
-- Name: exercise_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_sets (
    id integer NOT NULL,
    exercise_log_id integer,
    reps integer,
    weight double precision
);


--
-- Name: exercise_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exercise_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exercise_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exercise_sets_id_seq OWNED BY public.exercise_sets.id;


--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    id uuid NOT NULL,
    name character varying(200),
    muscle_group character varying(100),
    required_equipment character varying(100),
    difficulty_level character varying(50)
);


--
-- Name: progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress (
    user_id uuid NOT NULL,
    total_volume double precision,
    workouts_completed integer,
    avg_difficulty double precision,
    modifier double precision
);


--
-- Name: user_equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_equipment (
    user_id uuid NOT NULL,
    equipment_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    age integer,
    height double precision,
    weight double precision,
    goal character varying(50),
    level character varying(50),
    frequency integer
);


--
-- Name: workout_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_exercises (
    workout_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    sets integer,
    reps integer,
    weight double precision,
    rest integer
);


--
-- Name: workout_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workout_logs (
    id uuid NOT NULL,
    workout_id uuid,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workouts (
    id uuid NOT NULL,
    user_id uuid,
    status character varying(50),
    created_at timestamp without time zone
);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: exercise_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_logs ALTER COLUMN id SET DEFAULT nextval('public.exercise_logs_id_seq'::regclass);


--
-- Name: exercise_sets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_sets ALTER COLUMN id SET DEFAULT nextval('public.exercise_sets_id_seq'::regclass);


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.equipment VALUES
	(1, 'barbell'),
	(2, 'dumbbell'),
	(3, 'pullup_bar'),
	(7, 'bodyweight'),
	(16, '');


--
-- Data for Name: exercise_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_logs VALUES
	(78, '22222222-2222-2222-2222-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(79, '22222222-2222-2222-2222-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(80, '22222222-2222-2222-2222-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(81, '22222222-2222-2222-2222-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(82, '22222222-2222-2222-2222-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(83, '22222222-2222-2222-2222-000000000002', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(84, '22222222-2222-2222-2222-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(85, '22222222-2222-2222-2222-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(86, '22222222-2222-2222-2222-000000000003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(87, '22222222-2222-2222-2222-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(88, '22222222-2222-2222-2222-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(89, '22222222-2222-2222-2222-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(90, '22222222-2222-2222-2222-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(91, '22222222-2222-2222-2222-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(92, '22222222-2222-2222-2222-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(93, '22222222-2222-2222-2222-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(94, '22222222-2222-2222-2222-000000000006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(95, '22222222-2222-2222-2222-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(96, '22222222-2222-2222-2222-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(97, '22222222-2222-2222-2222-000000000007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(98, '22222222-2222-2222-2222-000000000007', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(99, '22222222-2222-2222-2222-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(100, '22222222-2222-2222-2222-000000000008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(101, '22222222-2222-2222-2222-000000000008', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(102, '22222222-2222-2222-2222-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(103, '22222222-2222-2222-2222-000000000009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(104, '22222222-2222-2222-2222-000000000009', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(105, '22222222-2222-2222-2222-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(106, '22222222-2222-2222-2222-000000000010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(107, '22222222-2222-2222-2222-000000000010', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(108, '22222222-2222-2222-2222-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(109, '22222222-2222-2222-2222-000000000011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(110, '22222222-2222-2222-2222-000000000011', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(111, '22222222-2222-2222-2222-000000000012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(112, '22222222-2222-2222-2222-000000000012', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(113, '22222222-2222-2222-2222-000000000012', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(114, '22222222-2222-2222-2222-000000000013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(115, '22222222-2222-2222-2222-000000000013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(116, '22222222-2222-2222-2222-000000000013', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(117, '22222222-2222-2222-2222-000000000014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(118, '22222222-2222-2222-2222-000000000014', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(119, '22222222-2222-2222-2222-000000000014', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(120, '22222222-2222-2222-2222-000000000015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(121, '22222222-2222-2222-2222-000000000015', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(122, '22222222-2222-2222-2222-000000000015', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(123, '22222222-2222-2222-2222-000000000016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(124, '22222222-2222-2222-2222-000000000016', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(125, '22222222-2222-2222-2222-000000000016', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(126, '22222222-2222-2222-2222-000000000017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(127, '22222222-2222-2222-2222-000000000017', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(128, '22222222-2222-2222-2222-000000000017', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(129, '22222222-2222-2222-2222-000000000018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(130, '22222222-2222-2222-2222-000000000018', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(131, '22222222-2222-2222-2222-000000000018', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(132, '22222222-2222-2222-2222-000000000019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(133, '22222222-2222-2222-2222-000000000019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(134, '22222222-2222-2222-2222-000000000019', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(135, '22222222-2222-2222-2222-000000000020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(136, '22222222-2222-2222-2222-000000000020', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(137, '22222222-2222-2222-2222-000000000020', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(138, '22222222-2222-2222-2222-000000000021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(139, '22222222-2222-2222-2222-000000000021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(140, '22222222-2222-2222-2222-000000000021', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(141, '22222222-2222-2222-2222-000000000022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(142, '22222222-2222-2222-2222-000000000022', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(143, '22222222-2222-2222-2222-000000000022', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(144, '22222222-2222-2222-2222-000000000023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(145, '22222222-2222-2222-2222-000000000023', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(146, '22222222-2222-2222-2222-000000000023', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5),
	(147, '22222222-2222-2222-2222-000000000024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
	(148, '22222222-2222-2222-2222-000000000024', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5),
	(149, '22222222-2222-2222-2222-000000000024', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5);


--
-- Data for Name: exercise_sets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercise_sets VALUES
	(3, 78, 8, 60),
	(4, 81, 8, 60),
	(5, 80, 10, 10),
	(6, 83, 10, 10),
	(7, 84, 8, 61),
	(8, 87, 8, 61),
	(9, 86, 10, 11),
	(10, 89, 10, 11),
	(11, 90, 8, 62),
	(12, 93, 8, 62),
	(13, 92, 10, 12),
	(14, 95, 10, 12),
	(15, 96, 8, 63),
	(16, 99, 8, 63),
	(17, 98, 10, 13),
	(18, 101, 10, 13),
	(19, 102, 8, 64),
	(20, 105, 8, 64),
	(21, 104, 10, 14),
	(22, 107, 10, 14),
	(23, 108, 8, 65),
	(24, 111, 8, 65),
	(25, 110, 10, 15),
	(26, 113, 10, 15),
	(27, 114, 8, 66),
	(28, 117, 8, 66),
	(29, 116, 10, 16),
	(30, 119, 10, 16),
	(31, 120, 8, 67),
	(32, 123, 8, 67),
	(33, 122, 10, 17),
	(34, 125, 10, 17),
	(35, 126, 8, 68),
	(36, 129, 8, 68),
	(37, 128, 10, 18),
	(38, 131, 10, 18),
	(39, 132, 8, 69),
	(40, 135, 8, 69),
	(41, 134, 10, 19),
	(42, 137, 10, 19),
	(43, 138, 8, 70),
	(44, 141, 8, 70),
	(45, 140, 10, 20),
	(46, 143, 10, 20),
	(47, 144, 8, 71),
	(48, 147, 8, 71),
	(49, 146, 10, 21),
	(50, 149, 10, 21);


--
-- Data for Name: exercises; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exercises VALUES
	('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 'chest', 'barbell', 'intermediate'),
	('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Push Up', 'chest', '', 'beginner'),
	('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pull Up', 'back', 'pullup_bar', 'intermediate'),
	('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Squat', 'legs', 'barbell', 'intermediate'),
	('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Overhead Press', 'shoulders', 'dumbbell', 'intermediate'),
	('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Bicep Curl', 'biceps', 'dumbbell', 'beginner'),
	('77777777-7777-7777-7777-777777777777', 'Tricep Dip', 'triceps', '', 'beginner');


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.progress VALUES
	('0655cc46-c1a9-45f2-894b-49628ba5bc53', 0, 0, 0, 1),
	('a2be15bd-d8a9-469a-a7c0-0d9d24c0bc69', 0, 0, 0, 1),
	('4b8986c6-22c7-46b5-9262-e0f050a2d4f4', 0, 0, 0, 1),
	('59a4f379-8de6-4342-a409-92766002f312', 0, 0, 0, 1),
	('94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', 0, 1, 4, 0.97),
	('11111111-1111-1111-1111-111111111111', 0, 12, 2.9166666666666665, 0.7830379904142021),
	('22222222-2222-2222-2222-222222222222', 450, 25, 5, 1);


--
-- Data for Name: user_equipment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_equipment VALUES
	('0655cc46-c1a9-45f2-894b-49628ba5bc53', 7),
	('a2be15bd-d8a9-469a-a7c0-0d9d24c0bc69', 7),
	('4b8986c6-22c7-46b5-9262-e0f050a2d4f4', 7),
	('59a4f379-8de6-4342-a409-92766002f312', 7),
	('94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', 7),
	('94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', 2),
	('11111111-1111-1111-1111-111111111111', 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES
	('0655cc46-c1a9-45f2-894b-49628ba5bc53', 20, 175, 60, 'strength', 'beginner', 3),
	('a2be15bd-d8a9-469a-a7c0-0d9d24c0bc69', 20, 175, 60, 'strength', 'beginner', 3),
	('4b8986c6-22c7-46b5-9262-e0f050a2d4f4', 20, 175, 60, 'strength', 'beginner', 3),
	('59a4f379-8de6-4342-a409-92766002f312', 20, 175, 60, 'strength', 'beginner', 3),
	('94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', 29, 178, 74, 'strength', 'beginner', 3),
	('11111111-1111-1111-1111-111111111111', 25, 180, 75, 'mass', 'intermediate', 2),
	('22222222-2222-2222-2222-222222222222', 40, 165, 60, 'weight_loss', 'beginner', 3);


--
-- Data for Name: workout_exercises; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workout_exercises VALUES
	('86b8da1c-a8cf-43bf-9d0c-3e5f15c8b0e1', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 4, 7, 36, 120),
	('86b8da1c-a8cf-43bf-9d0c-3e5f15c8b0e1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 7, 36, 120),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 8, 10.67, 90),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 8, 10.67, 90),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 8, 10.67, 90),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, 8, 10.67, 90),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 8, 10.67, 90),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', '77777777-7777-7777-7777-777777777777', 2, 8, 10.67, 90),
	('550e8400-e29b-41d4-a716-446655440001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 60, 120),
	('550e8400-e29b-41d4-a716-446655440001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
	('550e8400-e29b-41d4-a716-446655440001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 10, 90);


--
-- Data for Name: workout_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workout_logs VALUES
	('a5bfc43b-ebce-4d32-8eed-bd71e3c358e4', '86b8da1c-a8cf-43bf-9d0c-3e5f15c8b0e1', '94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', '2026-03-27 23:01:40.936893'),
	('feb6a391-d582-483f-a762-53f8341813a5', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:33:36.155116'),
	('84a1511f-9554-41c3-8c7d-39823690bdaf', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:36:33.122606'),
	('af949efe-1165-4e3b-b178-dfd9e3b22cbb', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:37:15.581006'),
	('ff86c075-1dcd-4c17-b502-3e1d73c39339', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:37:59.866914'),
	('b32a1ed2-244c-4278-8254-78fcc431df8f', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:40:23.594504'),
	('aa5c233c-7097-4814-a547-ab3e7821d669', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:41:42.371167'),
	('a3adc3ef-bca4-48af-a8e2-36cd1ad57502', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:42:23.575943'),
	('7ab9c12f-c05e-4c71-8318-18fef3b0ed1f', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:42:55.356808'),
	('87936608-0fd8-4f26-be8c-83ff8948c43d', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:46:33.666093'),
	('27b42c6a-2b9e-4488-8568-2bfe09a6e413', '2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', '2026-03-27 23:50:01.230254'),
	('22222222-2222-2222-2222-000000000001', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-05 08:00:00'),
	('22222222-2222-2222-2222-000000000002', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-07 18:00:00'),
	('22222222-2222-2222-2222-000000000003', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-12 08:00:00'),
	('22222222-2222-2222-2222-000000000004', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-14 18:00:00'),
	('22222222-2222-2222-2222-000000000005', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-19 08:00:00'),
	('22222222-2222-2222-2222-000000000006', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-21 18:00:00'),
	('22222222-2222-2222-2222-000000000007', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-26 08:00:00'),
	('22222222-2222-2222-2222-000000000008', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-01-28 18:00:00'),
	('22222222-2222-2222-2222-000000000009', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-02 08:00:00'),
	('22222222-2222-2222-2222-000000000010', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-04 18:00:00'),
	('22222222-2222-2222-2222-000000000011', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-09 08:00:00'),
	('22222222-2222-2222-2222-000000000012', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-11 18:00:00'),
	('22222222-2222-2222-2222-000000000013', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-16 08:00:00'),
	('22222222-2222-2222-2222-000000000014', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-18 18:00:00'),
	('22222222-2222-2222-2222-000000000015', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-23 08:00:00'),
	('22222222-2222-2222-2222-000000000016', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-02-25 18:00:00'),
	('22222222-2222-2222-2222-000000000017', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-02 08:00:00'),
	('22222222-2222-2222-2222-000000000018', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-04 18:00:00'),
	('22222222-2222-2222-2222-000000000019', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-09 08:00:00'),
	('22222222-2222-2222-2222-000000000020', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-11 18:00:00'),
	('22222222-2222-2222-2222-000000000021', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-16 08:00:00'),
	('22222222-2222-2222-2222-000000000022', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-18 18:00:00'),
	('22222222-2222-2222-2222-000000000023', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-23 08:00:00'),
	('22222222-2222-2222-2222-000000000024', '550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', '2026-03-25 18:00:00');


--
-- Data for Name: workouts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workouts VALUES
	('17c6ec45-866a-43ac-a3ba-20d12bbe9b17', '0655cc46-c1a9-45f2-894b-49628ba5bc53', 'created', '2026-03-28 00:51:50.442515'),
	('67892938-5f48-4930-88d7-61953d2e5c62', 'a2be15bd-d8a9-469a-a7c0-0d9d24c0bc69', 'created', '2026-03-28 00:51:51.922258'),
	('fa687f99-4b7a-4d9c-a7ea-a346d50f3e43', '4b8986c6-22c7-46b5-9262-e0f050a2d4f4', 'created', '2026-03-28 00:51:52.869664'),
	('0502198c-fd5b-4873-9334-95c083a0a02f', '59a4f379-8de6-4342-a409-92766002f312', 'created', '2026-03-28 00:51:53.858057'),
	('86b8da1c-a8cf-43bf-9d0c-3e5f15c8b0e1', '94f56b0b-4cd9-4a30-93ac-3f9d7ae83096', 'completed', '2026-03-28 04:01:40.912208'),
	('2cd43a28-987c-436b-b137-ad59bf6c3dc5', '11111111-1111-1111-1111-111111111111', 'completed', '2026-03-28 04:18:15.006405'),
	('550e8400-e29b-41d4-a716-446655440001', '22222222-2222-2222-2222-222222222222', 'completed', '2026-01-05 08:00:00');


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_id_seq', 19, true);


--
-- Name: exercise_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exercise_logs_id_seq', 149, true);


--
-- Name: exercise_sets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exercise_sets_id_seq', 50, true);


--
-- Name: equipment equipment_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_name_key UNIQUE (name);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: exercise_logs exercise_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_logs
    ADD CONSTRAINT exercise_logs_pkey PRIMARY KEY (id);


--
-- Name: exercise_sets exercise_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_sets
    ADD CONSTRAINT exercise_sets_pkey PRIMARY KEY (id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (user_id);


--
-- Name: user_equipment user_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_equipment
    ADD CONSTRAINT user_equipment_pkey PRIMARY KEY (user_id, equipment_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workout_exercises workout_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_pkey PRIMARY KEY (workout_id, exercise_id);


--
-- Name: workout_logs workout_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_logs
    ADD CONSTRAINT workout_logs_pkey PRIMARY KEY (id);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (id);


--
-- Name: exercise_logs exercise_logs_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_logs
    ADD CONSTRAINT exercise_logs_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: exercise_logs exercise_logs_workout_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_logs
    ADD CONSTRAINT exercise_logs_workout_log_id_fkey FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id);


--
-- Name: exercise_sets exercise_sets_exercise_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_sets
    ADD CONSTRAINT exercise_sets_exercise_log_id_fkey FOREIGN KEY (exercise_log_id) REFERENCES public.exercise_logs(id);


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_equipment user_equipment_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_equipment
    ADD CONSTRAINT user_equipment_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: user_equipment user_equipment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_equipment
    ADD CONSTRAINT user_equipment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workout_exercises workout_exercises_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id);


--
-- Name: workout_exercises workout_exercises_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_exercises
    ADD CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id);


--
-- Name: workout_logs workout_logs_workout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workout_logs
    ADD CONSTRAINT workout_logs_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id);


--
-- Name: workouts workouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--


