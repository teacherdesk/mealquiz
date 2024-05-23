import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import extractInitials from './extractInitials';
import './App.css';
import leftImage from './assets/left-image.png';
import rightImage from './assets/right-image.png';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Box
} from '@mui/material';

const App = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [mealDate, setMealDate] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const savedSchool = JSON.parse(localStorage.getItem('selectedSchool'));
    if (savedSchool) {
      setSelectedSchool(savedSchool);
      setSchoolName(savedSchool.SCHUL_NM);
    }
    setMealDate(new Date().toISOString().slice(0, 10).replace(/-/g, '')); // 오늘 날짜로 설정
  }, []);

  const fetchMeals = useCallback(async (schoolCode, educationOfficeCode, mealDate) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://open.neis.go.kr/hub/mealServiceDietInfo', {
        params: {
          KEY: '6760105bbc6040288708613a8c63125a',
          Type: 'json',
          pIndex: 1,
          pSize: 100,
          ATPT_OFCDC_SC_CODE: educationOfficeCode,
          SD_SCHUL_CODE: schoolCode,
          MLSV_YMD: mealDate,
        },
      });
      if (response.data.mealServiceDietInfo) {
        const mealList = extractValidDishNames(response.data.mealServiceDietInfo[1].row[0].DDISH_NM)
        setMeals(mealList);
        setCurrentQuizIndex(0);  // Reset quiz index when new meals are fetched
      } else {
        setMeals([]);
      }
    } catch (error) {
      setError('급식 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchMeals(selectedSchool.SD_SCHUL_CODE, selectedSchool.ATPT_OFCDC_SC_CODE, mealDate);
    }
  }, [selectedSchool, mealDate, fetchMeals]);

  const fetchSchoolCode = async (schoolName) => {
    try {
      const response = await axios.get('https://open.neis.go.kr/hub/schoolInfo', {
        params: {
          KEY: '6760105bbc6040288708613a8c63125a',
          Type: 'json',
          pIndex: 1,
          pSize: 100,
          SCHUL_NM: schoolName,
        },
      });
      if (response.data.schoolInfo) {
        return response.data.schoolInfo[1].row;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error('학교 정보를 가져오는 중 오류가 발생했습니다.');
    }
  };

  const handleSchoolSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const schools = await fetchSchoolCode(schoolName);
      setSchoolResults(schools);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setSchoolResults([]);
    localStorage.setItem('selectedSchool', JSON.stringify(school));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) {
      setError('학교를 선택하세요.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await fetchMeals(selectedSchool.SD_SCHUL_CODE, selectedSchool.ATPT_OFCDC_SC_CODE, mealDate);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuiz = () => {
    setShowAnswer(false);
    setCurrentQuizIndex((prevIndex) => (prevIndex + 1) % meals.length);
  };

  const extractValidDishNames = (dishName) => {
    if (typeof dishName !== 'string') {
      return [];
    }
    // Split the string by <br/> and trim each dish name
    const dishes = dishName.split('<br/>').map(dish => dish.trim());
    // Filter out dishes with numbers in parentheses and clean up the dish names
    const validDishes = dishes.map(dish => dish.replace(/\s*\(\d+(\.\d+)*\)\s*/g, '').trim());
    return validDishes;
  };

  return (
    <div className="app-container">
      <div className="side-image left-image" style={{ backgroundImage: `url(${leftImage})` }}></div>
      <div className="main-content">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">
              School Meals Quiz
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm">
          <Box mt={4}>
            {!selectedSchool && (
              <Box mb={4}>
                <TextField
                  label="학교명"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
                <Button variant="contained" color="primary" onClick={handleSchoolSearch} fullWidth>
                  검색
                </Button>
              </Box>
            )}
            {schoolResults.length > 0 && (
              <List>
                {schoolResults.map((school) => (
                  <ListItem button key={school.SD_SCHUL_CODE} onClick={() => handleSchoolSelect(school)}>
                    <ListItemText primary={`${school.SCHUL_NM} (${school.SD_SCHUL_CODE})`} />
                  </ListItem>
                ))}
              </List>
            )}
            {selectedSchool && (
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    선택된 학교: {selectedSchool.SCHUL_NM}
                  </Typography>
                  <Button variant="outlined" color="secondary" onClick={() => setSelectedSchool(null)} fullWidth>
                    학교 변경
                  </Button>
                  <form onSubmit={handleSubmit}>
                    <TextField
                      label="급식일자"
                      value={mealDate}
                      readOnly
                      fullWidth
                      variant="outlined"
                      margin="normal"
                    />
                    <Button variant="contained" color="primary" type="submit" fullWidth>
                      조회
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
            {loading && <Typography>Loading...</Typography>}
            {error && <Typography color="error">Error: {error}</Typography>}
            {meals.length > 0 && (
              <Box mt={4}>
                <Typography variant="h5">
                  급식 퀴즈
                </Typography>
                <Card>
                  <CardContent>
                    <Typography variant="h4" component="div" gutterBottom>
                      {extractInitials(meals[currentQuizIndex])}
                    </Typography>
                    {showAnswer && (
                      <Typography variant="h6" color="textSecondary">
                        정답: {meals[currentQuizIndex]}
                      </Typography>
                    )}
                    <Box mt={2}>
                      <Button variant="contained" color="primary" onClick={handleShowAnswer} fullWidth>
                        확인
                      </Button>
                      <Button variant="contained" color="secondary" onClick={handleNextQuiz} fullWidth sx={{ mt: 1 }}>
                        다음
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Container>
      </div>
      <div className="side-image right-image" style={{ backgroundImage: `url(${rightImage})` }}></div>
    </div>
  );
};

export default App
