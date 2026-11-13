import { createRoot } from "react-dom/client";
import { Layout } from "./components/Layout.tsx";
import { Empty, Link } from "./components/ui.tsx";
import { matchPath } from "./lib/paths.ts";
import { useLocation } from "./lib/router.ts";
import { Admin } from "./pages/Admin.tsx";
import { Cart, Wishlist } from "./pages/Cart.tsx";
import { Checkout, OrderPage, Orders } from "./pages/Checkout.tsx";
import { Home } from "./pages/Home.tsx";
import { ProductPage } from "./pages/ProductPage.tsx";
import { Shop } from "./pages/Shop.tsx";
import "./styles.css";

function Page() {
  const { path } = useLocation();
  if (path === "/") return <Home />;
  if (path === "/shop") return <Shop />;
  if (path === "/cart") return <Cart />;
  if (path === "/wishlist") return <Wishlist />;
  if (path === "/checkout") return <Checkout />;
  if (path === "/orders") return <Orders />;
  if (path === "/admin") return <Admin />;
  const product = matchPath("/product/:slug", path);
  if (product) return <ProductPage key={product.slug} slug={product.slug} />;
  const order = matchPath("/order/:id", path);
  if (order) return <OrderPage id={order.id} />;
  return (
    <div className="wrap section">
      <Empty title="Page not found" text="That page doesn't exist in this demo.">
        <Link to="/" className="btn">
          Back to home
        </Link>
      </Empty>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <Layout>
    <Page />
  </Layout>,
);
