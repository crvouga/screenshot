import { CameraAlt, Close } from '@mui/icons-material';
import { Button, Box, Drawer, Fab, Toolbar, useTheme } from '@mui/material';
import { useQuery } from 'react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthUserContext, useAuthState, useAuthUser } from './authentication';
import { AccountPage } from './pages/Account';
import { BrandedLoadingPage } from './pages/Loading';
import { LoginPage } from './pages/Login';
import { LogoutPage } from './pages/Logout';
import { ProjectsPage } from './pages/Projects';
import { ProjectsCreatePage } from './pages/ProjectsCreate';
import { ProjectSingleOverviewPage } from './pages/ProjectSingleOverview';
import { ProjectsSinglePage } from './pages/ProjectsSingle';
import { TryPage } from './pages/Try';
import { Link, routes, useNavigate, useLocation } from './routes';
import * as Profiles from './profiles';
import { ErrorPage } from './pages/Error';
import { AccountCreatePage } from './pages/AccountCreate';

export const App = () => {
  return (
    <Box
      sx={{
        maxWidth: 'md',
        position: 'fixed',
        width: '100%',
        height: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <LoadingAuth />
    </Box>
  );
};

const LoadingAuth = () => {
  const authState = useAuthState();

  switch (authState.type) {
    case 'Loading':
      return <BrandedLoadingPage />;

    case 'LoggedOut':
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      );

    case 'LoggedIn':
      return (
        <AuthUserContext
          userId={authState.userId}
          defaultName={authState.defaultName}
        >
          <LoadingProfile />
        </AuthUserContext>
      );
  }
};

const LoadingProfile = () => {
  const authUser = useAuthUser();

  const query = Profiles.useProfileQuery(authUser);

  switch (query.status) {
    case 'error':
      return <ErrorPage message="Failed to load profile" />;

    case 'idle':
      return <BrandedLoadingPage />;

    case 'loading':
      return <BrandedLoadingPage />;

    case 'success': {
      const result = query.data;

      switch (result.type) {
        case 'error':
          return <ErrorPage message="Failed to load profile" />;

        case 'not-found':
          return (
            <Routes>
              <Route path="/account/create" element={<AccountCreatePage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="*" element={<Navigate to="/account/create" />} />
            </Routes>
          );

        case 'found':
          return (
            <Profiles.ProfileContext profile={result.profile}>
              <Loaded />
            </Profiles.ProfileContext>
          );
      }
    }
  }
};

export const Loaded = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'scroll',
        }}
      >
        <Routes>
          <Route path={routes['/'].pattern} element={<ProjectsPage />} />

          <Route path={routes['/try'].pattern} element={<TryPage />} />

          <Route path={routes['/account'].pattern} element={<AccountPage />} />

          <Route
            path={routes['/projects'].pattern}
            element={<ProjectsPage />}
          />

          <Route
            path={routes['/projects/:id'].pattern}
            element={<ProjectsSinglePage />}
          >
            <Route
              path={routes['/projects/:id'].pattern}
              element={<ProjectSingleOverviewPage />}
            />
          </Route>

          <Route
            path={routes['/projects/create'].pattern}
            element={<ProjectsCreatePage />}
          />

          <Route path="/logout" element={<LogoutPage />} />

          <Route
            path="*"
            element={<Navigate to={routes['/projects'].pattern} />}
          />
        </Routes>

        <Box sx={{ p: 8 }}></Box>
      </Box>

      <Link to={location.pathname} state="try-drawer-opened">
        <Fab
          variant="extended"
          sx={{
            position: 'absolute',
            bottom: theme.spacing(4),
            right: theme.spacing(2),
          }}
        >
          <CameraAlt sx={{ mr: 1 }} />
          Try
        </Fab>
      </Link>

      <Drawer
        open={location.state === 'try-drawer-opened'}
        anchor="top"
        keepMounted
        PaperProps={{
          sx: { maxWidth: 'sm', paddingX: 2, marginX: 'auto' },
        }}
        onClose={() => {
          navigate({ to: location.pathname, state: 'closed' });
        }}
      >
        <Toolbar disableGutters>
          <Link to={location.pathname} state="closed">
            <Button sx={{ marginLeft: -1 }} startIcon={<Close />} size="large">
              Close
            </Button>
          </Link>
        </Toolbar>
        <TryPage />
      </Drawer>
    </>
  );
};