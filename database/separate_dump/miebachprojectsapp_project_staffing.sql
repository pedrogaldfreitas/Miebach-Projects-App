-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: miebachprojectsapp
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `project_staffing`
--

DROP TABLE IF EXISTS `project_staffing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_staffing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `role_name` varchar(100) DEFAULT NULL,
  `hourly_rate` int DEFAULT NULL,
  `forecast_hours_initial` int DEFAULT NULL,
  `forecast_hours_remaining` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_project_staffing_user_id` (`user_id`),
  KEY `ix_project_staffing_project_id` (`project_id`),
  KEY `ix_project_staffing_role_name` (`role_name`),
  KEY `ix_project_staffing_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_staffing`
--

LOCK TABLES `project_staffing` WRITE;
/*!40000 ALTER TABLE `project_staffing` DISABLE KEYS */;
INSERT INTO `project_staffing` VALUES (13,2,7597254,'Manager',23,131,0),(14,2,3497285,'Second Manager',19,200,0),(15,2,6482591,'Third Manager',30,200,0),(16,5,6482591,'524',243,24,0),(17,5,7597254,'gffgd',12,43,0),(18,5,3497285,'gffgd',50,43,0),(19,7,6482591,'Janitor',25,200,0),(20,12,6482591,'Janitor',13,400,0),(21,6,7597254,'Janitor',24,53,0),(22,6,3497285,'Secretary',50,50,0),(23,6,6482591,'Man',24,116,0),(24,15,7597255,'Tester',100,50,50),(25,13,7597254,'Boo',23,40,40),(26,16,7597255,'Second Alice Role',40,0,0),(27,16,7597254,'Joao Role',25,25,25),(28,9,7597254,'3424',141234,1234124,1234124),(29,9,7597254,'3424',141234,124,124),(30,9,7597254,'3424',141,124,124),(31,16,7597255,'10/18/2025',101,500,500);
/*!40000 ALTER TABLE `project_staffing` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-15 22:49:50
