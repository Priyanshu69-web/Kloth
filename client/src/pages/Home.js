import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Radio } from "antd";
import { Prices } from "../commponets/Prices";
import { useCart } from "../context/cart";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../commponets/Layouts/Layout";
import SkeletonCard from "../commponets/Layouts/SkeletonCard";
import { AiOutlineReload } from "react-icons/ai";
import Slider from "react-slick";
import "../styles/Homepage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ✅ Move debounce outside the component
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const API_URL = "https://kloth.onrender.com";

  const getInitialData = async () => {
    try {
      const [categoryRes, carouselRes] = await Promise.all([
        axios.get("/api/v1/category/get-category"),
        axios.get("/api/v1/craousel"),
      ]);
      if (categoryRes.data?.success) {
        setCategories(categoryRes.data?.category);
      }
      setCarouselItems(carouselRes.data || []);
    } catch (error) {
      toast.error("Error loading categories or carousel");
    }
  };

  useEffect(() => {
    getInitialData();
    getTotal();
  }, []);

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setProducts(data.products);
    } catch (error) {
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setTotal(data?.total);
    } catch (error) {
      toast.error("Error fetching total products count");
    }
  };

  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setProducts((prev) => [...prev, ...data.products]);
    } catch (error) {
      toast.error("Error loading more products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  const handleFilter = (value, id) => {
    setChecked((prev) => (value ? [...prev, id] : prev.filter((c) => c !== id)));
  };

  // ✅ Filter products on filter change
  const filterProduct = useCallback(
    debounce(async () => {
      try {
        const { data } = await axios.post("/api/v1/product/product-filters", {
          checked,
          radio,
        });
        setProducts(data?.products || []);
      } catch (error) {
        toast.error("Error applying filters");
      }
    }, 500),
    [checked, radio]
  );

  useEffect(() => {
    if (checked.length || radio.length) filterProduct();
  }, [checked, radio, filterProduct]);

  useEffect(() => {
    if (!checked.length && !radio.length) getAllProducts();
  }, [checked.length, radio.length]);

  const resetFilters = () => {
    setChecked([]);
    setRadio([]);
    setPage(1);
    getAllProducts();
  };

  const productCards = useMemo(
    () =>
      products.map((p) => (
        <div className="col-lg-4 col-md-6 col-sm-12 d-flex justify-content-center" key={p._id}>
          <div className="card h-100 w-100 border-0 shadow-sm rounded-4">
            <img
              src={`${API_URL}/api/v1/product/product-image/${p._id}`}
              className="card-img-top img-fluid rounded-top"
              alt={p.name}
              loading="lazy"
            />
            <div className="card-body d-flex flex-column text-center">
              <h5 className="card-title text-primary fw-bold">{p.name}</h5>
              <p className="card-text text-success fs-5">₹{p.price.toLocaleString("en-IN")}</p>
              <p className="text-muted small">{p.description.substring(0, 50)}...</p>
              <div className="mt-auto d-flex flex-column gap-2">
                <button className="btn btn-outline-info" onClick={() => navigate(`/product/${p.slug}`)}>
                  More Details
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setCart([...cart, p]);
                    localStorage.setItem("cart", JSON.stringify([...cart, p]));
                    toast.success("Item Added to cart");
                  }}
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>
      )),
    [products, cart, navigate, API_URL, setCart]
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <Layout title="All Products - Best Offers">
      {carouselItems.length > 0 ? (
        <Slider {...carouselSettings} className="mb-4">
          {carouselItems.map((item, index) => (
            <div key={index} className="carousel-slide">
              <img
                src={`${API_URL}/api/v1/craousel/image/${item._id}`}
                alt="carousel"
                className="banner-img img-fluid w-100"
              />
            </div>
          ))}
        </Slider>
      ) : (
        <img
          src="/images/banner.png"
          className="banner-img img-fluid w-100 mb-4"
          alt="bannerimage"
        />
      )}

      <div className="container-fluid row mt-3 home-page">
        {/* Filter Panel */}
        <div className="d-md-none text-end mb-3">
          <button className="btn btn-outline-primary" onClick={() => setShowFilters(!showFilters)}>
            <i className="fas fa-sliders-h"></i> Filters
          </button>
        </div>

        <div className={`col-md-3 filters p-4 shadow-sm bg-light rounded-4 mb-4 ${showFilters ? "d-block" : "d-none"} d-md-block`}>
          <h4 className="text-center text-primary mb-3">Filter By Category</h4>
          <div className="d-flex flex-column">
            {categories.map((c) => (
              <Checkbox key={c._id} className="mb-2" onChange={(e) => handleFilter(e.target.checked, c._id)}>
                {c.name}
              </Checkbox>
            ))}
          </div>

          <h4 className="text-center text-primary mt-4 mb-3">Filter By Price</h4>
          <Radio.Group onChange={(e) => setRadio(e.target.value)}>
            {Prices.map((p) => (
              <div key={p._id} className="mb-2">
                <Radio value={p.array}>{p.name}</Radio>
              </div>
            ))}
          </Radio.Group>

          <div className="text-center mt-4">
            <button className="btn btn-outline-danger" onClick={resetFilters}>RESET FILTERS</button>
          </div>
        </div>

        {/* Products */}
        <div className="col-md-9">
          <h1 className="text-center mb-4 text-dark fw-bold display-6">Discover Our Products</h1>
          <div className="row g-4">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                <div className="col-lg-4 col-md-6 col-sm-12 d-flex justify-content-center" key={index}>
                  <SkeletonCard />
                </div>
              ))
              : productCards}
          </div>

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="text-center p-4 text-muted">No products found</div>
          )}

          {/* Load More */}
          {products.length < total && products.length > 0 && (
            <div className="m-4 p-3 text-center">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading}
              >
                {loading ? "Loading ..." : <>Load More <AiOutlineReload /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
