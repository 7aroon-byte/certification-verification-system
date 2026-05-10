-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2026 at 09:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `certificatesystem`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super-admin','admin','student') NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_first_login` tinyint(1) DEFAULT 0,
  `status` varchar(20) DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `email`, `password_hash`, `role`, `created_by`, `created_at`, `is_first_login`, `status`) VALUES
(1, 'Admin', 's7afiu7aroon@gmail.com', '$2b$10$K2XJEl3h3.z.RES.V6iLUu0XhZbSItb4xXPBd.I6ThyLb2SF1n1mC', 'super-admin', NULL, '2025-12-03 11:27:03', 0, 'active'),
(4, 'Haruna Shafiu', 'bi220014@student.uthm.edu.my', '$2b$10$2zvSakAT.BjUm3ThHQn9Leu.Ng0GpOKLeJaNUq6UryTuokYG.spCe', 'admin', 1, '2026-02-24 17:05:41', 0, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `admin_log`
--

CREATE TABLE `admin_log` (
  `id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `login` datetime DEFAULT NULL,
  `logout` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_log`
--

INSERT INTO `admin_log` (`id`, `email`, `login`, `logout`) VALUES
(1, 's7afiu7aroon@gmail.com', '2026-02-25 02:26:44', NULL),
(2, 'bi220014@student.uthm.edu.my', '2026-02-25 02:27:32', NULL),
(3, 's7afiu7aroon@gmail.com', '2026-02-25 02:28:31', '2026-02-25 02:32:21'),
(4, 'bi220014@student.uthm.edu.my', '2026-02-25 02:32:41', '2026-02-25 02:32:45'),
(5, 's7afiu7aroon@gmail.com', '2026-02-25 02:32:56', '2026-02-25 02:33:38'),
(6, 'bi220014@student.uthm.edu.my', '2026-02-25 02:34:10', '2026-02-25 02:35:06'),
(7, 's7afiu7aroon@gmail.com', '2026-02-25 02:35:22', '2026-02-25 02:44:52'),
(8, 'bi220014@student.uthm.edu.my', '2026-02-25 02:45:23', '2026-02-25 02:57:07'),
(9, 's7afiu7aroon@gmail.com', '2026-02-25 02:57:23', '2026-02-25 02:58:28'),
(10, 's7afiu7aroon@gmail.com', '2026-02-25 23:49:20', '2026-02-25 23:49:50'),
(11, 's7afiu7aroon@gmail.com', '2026-02-26 02:45:33', '2026-02-26 02:45:40'),
(12, 's7afiu7aroon@gmail.com', '2026-02-26 06:52:10', '2026-02-26 06:53:23'),
(13, 's7afiu7aroon@gmail.com', '2026-02-26 07:48:50', '2026-02-26 08:00:31'),
(14, 's7afiu7aroon@gmail.com', '2026-02-26 08:10:33', '2026-02-26 08:47:56'),
(15, 's7afiu7aroon@gmail.com', '2026-02-28 22:56:39', '2026-02-28 23:38:12'),
(16, 's7afiu7aroon@gmail.com', '2026-02-28 23:40:11', '2026-02-28 23:50:28'),
(17, 's7afiu7aroon@gmail.com', '2026-02-28 23:50:48', '2026-02-28 23:51:14'),
(18, 's7afiu7aroon@gmail.com', '2026-02-28 23:51:24', '2026-03-01 00:13:54'),
(19, 's7afiu7aroon@gmail.com', '2026-03-01 00:15:46', '2026-03-01 01:01:10'),
(20, 'bi220014@student.uthm.edu.my', '2026-03-01 01:01:32', '2026-03-01 01:03:06'),
(21, 's7afiu7aroon@gmail.com', '2026-03-01 01:03:25', NULL),
(22, 'bi220014@student.uthm.edu.my', '2026-03-01 01:33:23', '2026-03-01 01:33:25'),
(23, 'bi220014@student.uthm.edu.my', '2026-03-01 01:33:30', '2026-03-01 01:33:40'),
(24, 's7afiu7aroon@gmail.com', '2026-03-01 01:33:51', '2026-03-01 02:13:08'),
(25, 'bi220014@student.uthm.edu.my', '2026-03-01 02:13:31', '2026-03-01 02:13:37'),
(26, 's7afiu7aroon@gmail.com', '2026-03-01 23:54:44', '2026-03-02 00:45:04'),
(27, 's7afiu7aroon@gmail.com', '2026-03-02 00:50:58', '2026-03-02 02:58:56'),
(28, 's7afiu7aroon@gmail.com', '2026-03-02 06:48:01', '2026-03-02 08:49:35'),
(29, 'bi220014@student.uthm.edu.my', '2026-03-02 08:50:17', '2026-03-02 08:50:41'),
(30, 's7afiu7aroon@gmail.com', '2026-03-02 09:02:12', NULL),
(31, 's7afiu7aroon@gmail.com', '2026-03-02 09:11:52', '2026-03-02 09:12:41'),
(32, 's7afiu7aroon@gmail.com', '2026-03-02 10:15:21', '2026-03-02 10:20:34'),
(33, 's7afiu7aroon@gmail.com', '2026-03-02 10:21:28', '2026-03-02 11:24:35'),
(34, 'bi220014@student.uthm.edu.my', '2026-03-02 11:24:58', '2026-03-02 11:25:14'),
(35, 's7afiu7aroon@gmail.com', '2026-03-02 11:25:24', NULL),
(36, 's7afiu7aroon@gmail.com', '2026-03-02 23:20:37', '2026-03-03 01:13:03'),
(37, 's7afiu7aroon@gmail.com', '2026-03-03 01:14:07', '2026-03-03 01:14:22'),
(38, 's7afiu7aroon@gmail.com', '2026-03-03 01:20:10', '2026-03-03 01:20:51'),
(39, 's7afiu7aroon@gmail.com', '2026-03-03 01:25:44', '2026-03-03 01:26:05'),
(40, 's7afiu7aroon@gmail.com', '2026-03-03 01:31:07', '2026-03-03 01:31:39'),
(41, 's7afiu7aroon@gmail.com', '2026-03-03 01:32:19', '2026-03-03 01:33:11'),
(42, 's7afiu7aroon@gmail.com', '2026-03-03 02:51:34', '2026-03-03 02:53:46'),
(43, 's7afiu7aroon@gmail.com', '2026-03-03 07:29:35', '2026-03-03 07:50:40'),
(44, 's7afiu7aroon@gmail.com', '2026-03-03 08:11:58', '2026-03-03 08:12:14'),
(45, 's7afiu7aroon@gmail.com', '2026-03-03 08:13:44', '2026-03-03 08:14:00'),
(46, 's7afiu7aroon@gmail.com', '2026-03-03 08:14:30', '2026-03-03 08:14:47'),
(47, 's7afiu7aroon@gmail.com', '2026-03-03 08:15:15', '2026-03-03 08:15:53'),
(48, 's7afiu7aroon@gmail.com', '2026-03-03 08:55:19', NULL),
(49, 's7afiu7aroon@gmail.com', '2026-03-05 23:29:49', '2026-03-05 23:30:45'),
(50, 's7afiu7aroon@gmail.com', '2026-03-05 23:31:12', '2026-03-05 23:31:23'),
(51, 's7afiu7aroon@gmail.com', '2026-03-05 23:31:58', '2026-03-05 23:33:14'),
(52, 's7afiu7aroon@gmail.com', '2026-03-05 23:33:50', '2026-03-05 23:34:05'),
(53, 's7afiu7aroon@gmail.com', '2026-03-05 23:35:12', '2026-03-05 23:35:19'),
(54, 's7afiu7aroon@gmail.com', '2026-03-05 23:36:01', '2026-03-06 00:09:09'),
(55, 's7afiu7aroon@gmail.com', '2026-03-06 00:09:27', '2026-03-06 00:09:33'),
(56, 's7afiu7aroon@gmail.com', '2026-03-06 00:09:48', '2026-03-06 00:09:57'),
(57, 's7afiu7aroon@gmail.com', '2026-03-06 00:10:20', '2026-03-06 00:10:35'),
(58, 's7afiu7aroon@gmail.com', '2026-03-06 00:13:15', '2026-03-06 00:16:07'),
(59, 's7afiu7aroon@gmail.com', '2026-03-06 00:32:30', '2026-03-06 00:35:30'),
(60, 's7afiu7aroon@gmail.com', '2026-03-06 00:41:19', '2026-03-06 01:47:58'),
(61, 's7afiu7aroon@gmail.com', '2026-03-06 01:49:10', '2026-03-06 01:49:20'),
(62, 's7afiu7aroon@gmail.com', '2026-03-30 14:41:10', NULL),
(63, 's7afiu7aroon@gmail.com', '2026-04-01 11:17:34', '2026-04-01 11:23:21'),
(64, 's7afiu7aroon@gmail.com', '2026-04-01 11:23:50', NULL),
(65, 's7afiu7aroon@gmail.com', '2026-04-01 11:36:12', NULL),
(66, 's7afiu7aroon@gmail.com', '2026-04-14 08:34:27', '2026-04-14 08:34:44'),
(67, 's7afiu7aroon@gmail.com', '2026-04-20 22:41:28', '2026-04-20 22:42:46');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `enrollment_number` varchar(100) NOT NULL,
  `student_name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `finished_date` date NOT NULL,
  `date_issued` date NOT NULL,
  `pdf_hash` varchar(256) DEFAULT NULL,
  `blockchain_tx_hash` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'issued',
  `blockchain_status` varchar(50) DEFAULT 'pending',
  `issuer_wallet` varchar(100) DEFAULT NULL,
  `verification_code` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `exam_type` varchar(50) DEFAULT NULL,
  `position_held` varchar(255) DEFAULT NULL,
  `conduct` varchar(50) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `student_id`, `enrollment_number`, `student_name`, `start_date`, `finished_date`, `date_issued`, `pdf_hash`, `blockchain_tx_hash`, `status`, `blockchain_status`, `issuer_wallet`, `verification_code`, `created_at`, `updated_at`, `exam_type`, `position_held`, `conduct`, `is_deleted`, `deleted_at`) VALUES
(92, 13, 'SID-2015-036', 'HUZAIFA SHAFIU HARUNA', '2015-01-01', '2018-12-31', '2026-03-05', '895944e4934afb94316cf029117b04748971bfb37ad359d244a1e01a97d833ee', '0xbd3c03c929ed5266c476e7956eca141a0d120f2f8dec971440026d86f96b0bb9', '', 'deleted', '0x57ccf4c0f9a625e643f7545d51601a06bbe58873', '8cafc016522b0a20ea8ad2200d3be94a', '2026-03-05 16:08:21', '2026-03-05 16:09:56', 'SSCE', 'None', 'Excellent', 1, NULL),
(93, 12, 'SID-2010-62', 'SAFIYYA NASIR', '2010-01-01', '2014-12-31', '2026-03-05', 'dc5095790d172fd507ca0ab937355bc2aab155347aeabb1afe4faa81f3d90100', '0xbbe80847cfcd784c790a46fd297354f69e79dc46fa3755653a25227306063ad5', 'issued', 'onchain', '0x57ccf4c0f9a625e643f7545d51601a06bbe58873', '357fbfe6bad1c5f825b71846c710a4c9', '2026-03-05 16:10:26', '2026-03-05 16:10:27', 'SSCE', 'None', 'Excellent', 0, NULL),
(94, 16, 'SID-2021-119', 'MUHAMMAD AUWAL', '2021-01-01', '2024-12-31', '2026-03-05', '7fac3112ffa6ef5f6d1f9bd5ee18378e94eec39b694a26a7670be1ee8690458f', '0xafc57e9561542e80fc60952f23e8ff8e5747342670b0344f06ff619b6c248b84', 'issued', 'onchain', '0x57ccf4c0f9a625e643f7545d51601a06bbe58873', '1a82c8adf60c1a44783d21afeab7972f', '2026-03-05 16:10:31', '2026-03-05 16:10:32', 'SSCE', 'None', 'Excellent', 0, NULL),
(95, 34, 'SID-2018-022', 'Haruna Shafiu Shafiu', '2018-01-01', '2021-12-31', '2026-03-05', '0e28fe607bd2dd90057aefaa6e0722be98edea2f386b2dbdb9ebb55a930bd590', '0x5da9e8d033806ac057388c447cc4a948c9379759a537e7b028258911f9adc0b4', 'issued', 'onchain', '0x57ccf4c0f9a625e643f7545d51601a06bbe58873', '93bcfa3d477732c25f550e415713ca55', '2026-03-05 17:49:18', '2026-03-05 17:49:18', 'SSCE', 'Class Rep', 'Excellent', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `certificate_log`
--

CREATE TABLE `certificate_log` (
  `id` bigint(20) NOT NULL,
  `userid` int(11) DEFAULT NULL,
  `userrole` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied') DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `message`, `status`, `created_at`, `updated_at`) VALUES
(1, 'haruna shafiu', 's7afiu7aroon@gmail.com', 'gcygiuckfkccgjk', 'replied', '2025-12-13 18:29:10', '2025-12-13 18:30:53');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `enrollment_number` varchar(50) DEFAULT NULL,
  `role` enum('student') DEFAULT 'student',
  `status` enum('active','inactive','graduated','suspended','deleted') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_first_login` tinyint(1) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `enrollment_year` varchar(4) DEFAULT NULL,
  `graduation_year` varchar(4) DEFAULT NULL,
  `position_held` varchar(255) DEFAULT NULL,
  `conduct` varchar(50) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `email`, `password_hash`, `enrollment_number`, `role`, `status`, `created_at`, `updated_at`, `is_first_login`, `is_deleted`, `deleted_at`, `enrollment_year`, `graduation_year`, `position_held`, `conduct`, `phone_number`) VALUES
(12, 'SAFIYYA NASIR', 'safiyyanasir001@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2010-62', 'student', 'graduated', '2025-12-14 20:58:19', '2026-03-05 16:10:26', 1, 0, NULL, '2010', '2014', 'None', 'Excellent', NULL),
(13, 'HUZAIFA SHAFIU HARUNA', 'Mikohuzaifashafiu@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2015-036', 'student', 'active', '2025-12-14 20:58:59', '2026-03-05 16:09:32', 1, 0, NULL, '2015', '2018', 'None', 'Excellent', NULL),
(15, 'MAHMUD MUHAMMAD TAHIR', 'mahmudmuhammadtahir2004@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2013-033', 'student', 'active', '2025-12-14 20:59:58', '2026-03-05 15:52:32', 1, 0, NULL, '2013', '2017', 'None', 'Excellent', NULL),
(16, 'MUHAMMAD AUWAL', 'auwaldasukee@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2021-119', 'student', 'graduated', '2025-12-14 21:00:37', '2026-03-05 16:10:31', 1, 0, NULL, '2021', '2024', 'None', 'Excellent', NULL),
(17, 'FATIMA ABUBAKAR SUNUSI', 'fatimaabubakar4635@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', '001B', 'student', 'inactive', '2025-12-14 21:01:09', '2026-03-01 22:51:22', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'UMMU-SALMA MUHAMMAD', 'salmerhabdullahi65@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2023-101', 'student', 'active', '2025-12-14 21:16:35', '2026-03-03 01:08:49', 1, 0, NULL, '2023', '2026', 'None', 'Excellent', NULL),
(19, 'FAUZIYYA HASSAN DANTIYE ', 'fauzydantiye@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2018-017', 'student', 'active', '2025-12-16 04:32:09', '2026-03-05 15:52:39', 1, 0, NULL, '2018', '2021', 'Prefect', 'Excellent', NULL),
(21, 'USMAN SALIS IBRAHIM', 'Usmansalis85@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2022-113', 'student', 'active', '2025-12-16 04:34:13', '2026-03-02 00:35:18', 1, 0, NULL, '2022', '2025', 'None', NULL, NULL),
(27, 'HAFIZ MUHAMMAD BABA', 'hafeezmuhammadbaba@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2016-043', 'student', 'active', '2025-12-16 04:38:03', '2026-03-03 01:08:56', 1, 0, NULL, '2016', '2019', 'Prefect', 'Excellent', NULL),
(28, 'Safiyya Shafiu Haruna', 'Safiyyashafiu87@gmail.com', '$2b$10$lRfKM0TQ4MH/z0.h75mvwutfukkum6pdHsFFnSHN99PcXo9ZgR6QK', 'SID-2019-107', 'student', 'active', '2026-01-12 07:06:28', '2026-03-02 02:16:46', 1, 0, NULL, '2019', '2025', 'None', 'Excellent', NULL),
(31, 'Abdulmumin Alhassan', 'abdullbbj340@gmail.com', '$2b$10$G4xiveGMCTx93YzP0aK7O.SOXKRDzPYB3iV0jIHEjdryF5iXvF9xy', 'SID-2018-013', 'student', 'active', '2026-01-13 09:22:37', '2026-03-05 15:52:36', 0, 0, NULL, '2018', '2023', 'Prefect', 'Excellent', NULL),
(32, 'AMINU SADI YAHAYA ', 'ameenusabayya01@gmail.com', '$2b$10$7mjOXX.ZwCufdP5EyNIVWuk5A3ycDT4diwe8SzkfS4.WPUNGfFTDe', '2020', 'student', 'inactive', '2026-03-01 18:25:22', '2026-03-01 23:03:21', 1, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'Ahmad Abubabakar Abdullahi ', 'ahmadabubakarabdullahi29@gmail.com', '$2b$10$FtNmKWBXgQdpptRfCJ4.TuvMi0t4m.JfeXZpyghuysI2yqZtnnZHK', 'SID-2019-016', 'student', 'active', '2026-03-01 18:52:02', '2026-03-05 15:52:34', 1, 0, NULL, '2019', '2022', 'Class rep', 'Excellent', NULL),
(34, 'Haruna Shafiu Shafiu', 'bi220014@student.uthm.edu.my', '$2b$10$lWJzNK8K7r0G.ETjXi5iVOJw3lXwbeElkCIBP8CYrIX2qoaxnnnWW', 'SID-2018-022', 'student', 'graduated', '2026-03-01 22:57:58', '2026-03-05 17:49:18', 0, 0, NULL, '2018', '2021', 'Class Rep', 'Excellent', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_log`
--

CREATE TABLE `student_log` (
  `id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `login` datetime DEFAULT NULL,
  `logout` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_log`
--

INSERT INTO `student_log` (`id`, `email`, `login`, `logout`) VALUES
(1, 'abdullbbj340@gmail.com', '2026-02-25 02:26:31', '2026-02-25 02:26:34'),
(2, 'abdullbbj340@gmail.com', '2026-02-26 07:23:26', '2026-02-26 07:26:45'),
(3, 'abdullbbj340@gmail.com', '2026-02-26 07:27:07', '2026-02-26 07:35:02'),
(4, 'abdullbbj340@gmail.com', '2026-03-01 02:13:56', '2026-03-01 02:15:31'),
(5, 'abdullbbj340@gmail.com', '2026-03-02 08:50:59', NULL),
(6, 'abdullbbj340@gmail.com', '2026-03-02 09:04:35', '2026-03-02 09:08:18'),
(7, 'abdullbbj340@gmail.com', '2026-03-02 09:29:05', '2026-03-02 09:29:15'),
(8, 'abdullbbj340@gmail.com', '2026-03-02 09:33:40', '2026-03-02 09:34:37'),
(9, 'bi220014@student.uthm.edu.my', '2026-03-02 09:51:08', '2026-03-02 09:57:19'),
(10, 'bi220014@student.uthm.edu.my', '2026-03-03 01:13:53', '2026-03-03 01:14:00'),
(11, 'bi220014@student.uthm.edu.my', '2026-03-03 01:14:35', '2026-03-03 01:19:54'),
(12, 'bi220014@student.uthm.edu.my', '2026-03-03 01:21:00', '2026-03-03 01:25:35'),
(13, 'bi220014@student.uthm.edu.my', '2026-03-03 01:26:12', '2026-03-03 01:31:00'),
(14, 'bi220014@student.uthm.edu.my', '2026-03-03 01:31:58', '2026-03-03 01:32:11'),
(15, 'bi220014@student.uthm.edu.my', '2026-03-03 01:36:02', '2026-03-03 01:36:04'),
(16, 'bi220014@student.uthm.edu.my', '2026-03-03 07:05:39', '2026-03-03 07:06:27'),
(17, 'bi220014@student.uthm.edu.my', '2026-03-03 08:11:26', '2026-03-03 08:11:35'),
(18, 'bi220014@student.uthm.edu.my', '2026-03-06 01:48:41', '2026-03-06 01:49:03'),
(19, 'bi220014@student.uthm.edu.my', '2026-03-06 01:49:26', '2026-03-06 02:01:58'),
(20, 'bi220014@student.uthm.edu.my', '2026-03-30 14:40:55', '2026-03-30 14:41:02'),
(21, 'bi220014@student.uthm.edu.my', '2026-04-20 22:43:12', '2026-04-20 22:44:22');

-- --------------------------------------------------------

--
-- Table structure for table `verification_logs`
--

CREATE TABLE `verification_logs` (
  `id` bigint(20) NOT NULL,
  `visitor_key` varchar(64) DEFAULT NULL,
  `query_mode` varchar(20) NOT NULL,
  `query_input` varchar(255) DEFAULT NULL,
  `certificate_id` int(11) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `result_status` varchar(30) NOT NULL,
  `is_valid` tinyint(1) NOT NULL DEFAULT 0,
  `http_status` int(11) NOT NULL DEFAULT 200,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `visitor_tracking`
--

CREATE TABLE `visitor_tracking` (
  `id` bigint(20) NOT NULL,
  `visitor_key` varchar(64) NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(1000) DEFAULT NULL,
  `visited_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_admin_email` (`email`);

--
-- Indexes for table `admin_log`
--
ALTER TABLE `admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_log_email` (`email`),
  ADD KEY `idx_admin_log_login` (`login`),
  ADD KEY `idx_admin_log_logout` (`logout`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `certificate_log`
--
ALTER TABLE `certificate_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_certificate_log_user` (`userid`,`userrole`),
  ADD KEY `idx_certificate_log_email` (`email`),
  ADD KEY `idx_certificate_log_action` (`action`),
  ADD KEY `idx_certificate_log_created_at` (`created_at`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `enrollment_number` (`enrollment_number`),
  ADD UNIQUE KEY `uniq_students_enrollment` (`enrollment_number`),
  ADD KEY `idx_students_email` (`email`),
  ADD KEY `idx_students_enrollment` (`enrollment_number`);

--
-- Indexes for table `student_log`
--
ALTER TABLE `student_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_log_email` (`email`),
  ADD KEY `idx_student_log_login` (`login`),
  ADD KEY `idx_student_log_logout` (`logout`);

--
-- Indexes for table `verification_logs`
--
ALTER TABLE `verification_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_verification_logs_created_at` (`created_at`),
  ADD KEY `idx_verification_logs_result_status` (`result_status`),
  ADD KEY `idx_verification_logs_serial_number` (`serial_number`),
  ADD KEY `idx_verification_logs_mode` (`query_mode`);

--
-- Indexes for table `visitor_tracking`
--
ALTER TABLE `visitor_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_visitor_tracking_visited_at` (`visited_at`),
  ADD KEY `idx_visitor_tracking_visitor_key` (`visitor_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `admin_log`
--
ALTER TABLE `admin_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `certificate_log`
--
ALTER TABLE `certificate_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `student_log`
--
ALTER TABLE `student_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `verification_logs`
--
ALTER TABLE `verification_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `visitor_tracking`
--
ALTER TABLE `visitor_tracking`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin` (`id`);

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
